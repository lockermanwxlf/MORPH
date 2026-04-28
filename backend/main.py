from contextlib import asynccontextmanager

from fastapi import FastAPI

import postgres
from auth.endpoints import router as auth_router
from progress.endpoints import router as progress_router
from users.endpoints import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    postgres.init_postgres()
    yield
    postgres.cleanup_postgres()


app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(progress_router)
