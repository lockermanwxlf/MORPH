from typing import Literal

from pydantic import BaseModel, EmailStr


GradeLevel = Literal["k-5", "6-12", "uni"]


class UserProfileUpdate(BaseModel):
    grade_level: GradeLevel


class UserProfile(BaseModel):
    email: EmailStr
    grade_level: GradeLevel
