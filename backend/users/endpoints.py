from typing import cast

from fastapi import APIRouter, Body, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from auth.endpoints import CurrentUser
from auth.model import UsersConnection
from users.model import UserProfile, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/profile", response_model=UserProfile)
async def get_profile(
    users: UsersConnection,
    current_user: CurrentUser,
):
    row = await run_in_threadpool(
        users.execute,
        "SELECT grade_level FROM user_profiles WHERE email = %s",
        (current_user.email,),
    )
    profile_row = await run_in_threadpool(row.fetchone)
    if not profile_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    profile = cast(dict[str, str], profile_row)
    return UserProfile(email=current_user.email, grade_level=profile["grade_level"])


@router.put("/me/profile", response_model=UserProfile)
async def upsert_profile(
    users: UsersConnection,
    current_user: CurrentUser,
    profile_update: UserProfileUpdate = Body(...),
):
    await run_in_threadpool(
        users.execute,
        """
        INSERT INTO user_profiles (email, grade_level)
        VALUES (%s, %s)
        ON CONFLICT (email)
        DO UPDATE SET grade_level = EXCLUDED.grade_level
        """,
        (current_user.email, profile_update.grade_level),
    )
    return UserProfile(email=current_user.email, grade_level=profile_update.grade_level)
