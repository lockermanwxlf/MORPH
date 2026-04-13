from dataclasses import dataclass
from typing import Annotated

from azure.cosmos.aio import ContainerProxy
from fastapi import Depends
from pydantic import BaseModel, EmailStr

from config import USERS_CONTAINER_NAME
from cosmos import CosmosDatabase


@dataclass
class Token:
    token: str
    type: str


@dataclass
class TokenData:
    email = None


class UserRegister(BaseModel):
    email: EmailStr
    password: str


@dataclass
class User:
    email: str


@dataclass
class DbUser(User):
    password_hash: str


def get_user_container(database: CosmosDatabase):
    return database.get_container_client(USERS_CONTAINER_NAME)


UsersContainer = Annotated[ContainerProxy, Depends(get_user_container)]
