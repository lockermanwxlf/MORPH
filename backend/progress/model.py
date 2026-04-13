from pydantic import BaseModel


class CompletedLessonsResponse(BaseModel):
    lesson_ids: list[str]
