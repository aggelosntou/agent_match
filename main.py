from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from models import Request, MatchResponse, CreateUserRequest, User
from matcher import parse_prompt, match_users, select_group
from repository import get_all_users, create_user_in_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.post("/match", response_model=MatchResponse)
def match(request: Request):
    parsed = parse_prompt(request.prompt)
    users = get_all_users()

    matches = match_users(parsed, users)
    selected_group = select_group(matches, parsed)

    requested_people = max((parsed.group_size or 1) - 1, 0)
    found_people = len(selected_group)

    return MatchResponse(
        parsed_prompt=parsed,
        matches=matches,
        selected_group=selected_group,
        requested_people=requested_people,
        found_people=found_people,
    )


@app.post("/users", response_model=User)
def create_user(request: CreateUserRequest):
    new_user = User(
        name=request.name,
        interests=request.interests,
        location=request.location,
        skill_level=request.skill_level,
        availability=request.availability,
    )

    return create_user_in_db(new_user)


@app.get("/users", response_model=List[User])
def list_users():
    return get_all_users()