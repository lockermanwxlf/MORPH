from pydantic import BaseModel, EmailStr


class UserProfileUpdate(BaseModel):
    grade_level: str


class UserProfile(BaseModel):
    email: EmailStr
    grade_level: str
