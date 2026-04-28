from datetime import datetime, timedelta, timezone
import os
from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.concurrency import run_in_threadpool
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from pwdlib import PasswordHash
from psycopg.errors import UniqueViolation

from auth.model import DbUser, User, UserRegister, UsersConnection
from config import TOKEN_DEFAULT_EXPIRY

_jwt_secret_key = os.getenv("JWT_SECRET_KEY")
if not _jwt_secret_key:
    if os.getenv("BUILD") == "production":
        raise RuntimeError("JWT_SECRET_KEY is undefined.")
    print("JWT_SECRET_KEY is undefined. Falling back to default in development build.")
    _jwt_secret_key = "805cc53d0c0b6967ad121acd209e24823eb2c1f30e6eecaee52a22c23b4ba990"
JWT_SECRET_KEY: str = _jwt_secret_key
JWT_ALGORITHM = "HS256"

password_hash = PasswordHash.recommended()

DUMMY_HASH = password_hash.hash("dummypassword")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def verify_password(plain_password, hashed_password):
    return await run_in_threadpool(
        password_hash.verify, plain_password, hashed_password
    )


async def get_password_hash(password):
    return await run_in_threadpool(password_hash.hash, password)


async def get_user(users: UsersConnection, email: str):
    row = await run_in_threadpool(
        users.execute,
        "SELECT email, password_hash FROM users WHERE email = %s",
        (email,),
    )
    user_row = await run_in_threadpool(row.fetchone)
    if not user_row:
        return None
    user = cast(dict[str, str], user_row)
    return DbUser(**user)


async def authenticate_user(
    users: UsersConnection, email: str, password: str
) -> DbUser | Literal[False]:
    user = await get_user(users, email)
    if not user:
        await verify_password(password, DUMMY_HASH)
        return False
    if not await verify_password(password, user.password_hash):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=TOKEN_DEFAULT_EXPIRY)
    )
    to_encode.update({"exp": expire})
    encoded = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded


AccessToken = Annotated[str, Depends(oauth2_scheme)]


async def get_current_user(token: AccessToken, users: UsersConnection) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = await get_user(users, email)
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(
    users: UsersConnection,
    user_data: UserRegister = Body(...),
):
    existing_user = await get_user(users, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    password_hash_val = await get_password_hash(user_data.password)
    user = DbUser(email=user_data.email, password_hash=password_hash_val)
    try:
        await run_in_threadpool(
            users.execute,
            "INSERT INTO users (email, password_hash) VALUES (%s, %s)",
            (user.email, user.password_hash),
        )
    except UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    return {"message": "User created successfully"}


@router.post("/token")
async def login(
    users: UsersConnection,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = await authenticate_user(users, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
