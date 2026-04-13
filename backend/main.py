from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import FastAPI

import cosmos


@asynccontextmanager
async def lifespan(app: FastAPI):
    await cosmos.init_cosmos()
    yield
    await cosmos.cleanup_cosmos()


app = FastAPI(lifespan=lifespan)
