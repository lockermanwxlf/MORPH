from typing import cast

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from psycopg import errors

from auth.endpoints import CurrentUser
from auth.model import UsersConnection
from progress.model import CompletedLessonsResponse

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/me/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    lesson_id: str,
    users: UsersConnection,
    current_user: CurrentUser,
):
    if not lesson_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lesson_id cannot be empty",
        )

    try:
        await run_in_threadpool(
            users.execute,
            """
            INSERT INTO user_lesson_completions (user_email, lesson_id)
            VALUES (%s, %s)
            """,
            (current_user.email, lesson_id),
        )
    except errors.UniqueViolation:
        pass

    return {"message": "Lesson marked as completed"}


@router.get("/me/lessons/completed", response_model=CompletedLessonsResponse)
async def list_completed_lessons(
    users: UsersConnection,
    current_user: CurrentUser,
):
    row = await run_in_threadpool(
        users.execute,
        """
        SELECT lesson_id
        FROM user_lesson_completions
        WHERE user_email = %s
        ORDER BY completed_at ASC
        """,
        (current_user.email,),
    )
    completed_rows = await run_in_threadpool(row.fetchall)
    lessons = [cast(dict[str, str], r)["lesson_id"] for r in completed_rows]
    return CompletedLessonsResponse(lesson_ids=lessons)
