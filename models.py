from typing import List, Optional

from pydantic import field_validator
from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import SQLModel, Field


class CreateUserRequest(SQLModel):
    name: str = Field(min_length=1)
    interests: List[str]
    location: str = Field(min_length=1)
    skill_level: str
    availability: List[str]

    @field_validator("skill_level")
    @classmethod
    def validate_skill_level(cls, value: str) -> str:
        allowed = {"beginner", "intermediate", "advanced"}
        if value not in allowed:
            raise ValueError("Invalid skill level")
        return value

    @field_validator("interests", "availability")
    @classmethod
    def validate_lists(cls, value: List[str]) -> List[str]:
        if len(value) == 0:
            raise ValueError("List cannot be empty")
        return value


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(min_length=1)
    interests: List[str] = Field(sa_column=Column(JSON))
    location: str = Field(min_length=1)
    skill_level: str
    availability: List[str] = Field(sa_column=Column(JSON))

    @field_validator("skill_level")
    @classmethod
    def validate_skill_level(cls, value: str) -> str:
        allowed = {"beginner", "intermediate", "advanced"}
        if value not in allowed:
            raise ValueError("Invalid skill level")
        return value

    @field_validator("interests", "availability")
    @classmethod
    def validate_lists(cls, value: List[str]) -> List[str]:
        if len(value) == 0:
            raise ValueError("List cannot be empty")
        return value


class Request(SQLModel):
    prompt: str


class ParsedPrompt(SQLModel):
    activity: Optional[str] = None
    location: Optional[str] = None
    skill_level: Optional[str] = None
    availability: Optional[str] = None
    group_size: Optional[int] = None


class MatchResult(SQLModel):
    user: User
    score: int


class MatchResponse(SQLModel):
    parsed_prompt: ParsedPrompt
    matches: List[MatchResult]
    selected_group: List[User]
    requested_people: int
    found_people: int