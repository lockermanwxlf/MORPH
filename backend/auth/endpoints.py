from datetime import datetime, timedelta, timezone
import os
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import OAuth2PasswordBearer
import jwt
from pwdlib import PasswordHash
from yaml import emit

from auth.model import DbUser, User, UsersContainer
from config import TOKEN_DEFAULT_EXPIRY

JWT_SECRET_KEY = os.environ("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    if os.environ["BUILD"] == "production":
        raise RuntimeError("JWT_SECRET_KEY is undefined.")
    print("JWT_SECRET_KEY is undefined. Falling back to default in development build.")
    JWT_SECRET_KEY = "805cc53d0c0b6967ad121acd209e24823eb2c1f30e6eecaee52a22c23b4ba990"
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


async def get_user(users: UsersContainer, email: str):
    user = await users.read_item(item=email, partition_key=email)
    return DbUser(user.__dict__)


async def authenticate_user(users: UsersContainer, email: str, password: str) -> User:
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


async def get_current_user(token: AccessToken, users: UsersContainer) -> User:
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


CurrentUser = Annotated[User, get_current_user]
