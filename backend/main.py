import json
from pathlib import Path

from fastapi import FastAPI

app = FastAPI()

lessons_dir = Path("lessons")
lessons = [json.loads(f.read_text()) for f in lessons_dir.iterdir() if f.is_file()]


@app.get("/lessons")
def get_lessons():
    return lessons
