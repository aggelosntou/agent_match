from typing import List, Optional
from pydantic import BaseModel

VALID_SKILL_LEVELS = {"beginner", "intermediate", "advanced"}


class UserPublic(BaseModel):
    id: str
    name: str
    interests: List[str]
    location: str
    skill_level: str
    availability: List[str]
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    interests: List[str]
    location: str
    skill_level: str
    availability: List[str]


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class Request(BaseModel):
    prompt: str


class ParsedPrompt(BaseModel):
    activity: Optional[str] = None
    location: Optional[str] = None
    skill_level: Optional[str] = None
    availability: Optional[str] = None
    group_size: Optional[int] = None


class MatchResult(BaseModel):
    user: UserPublic
    score: int


class MatchResponse(BaseModel):
    parsed_prompt: ParsedPrompt
    matches: List[MatchResult]
    selected_group: List[UserPublic]
    requested_people: int
    found_people: int


class ConnectRequest(BaseModel):
    to_user_id: str
    activity: Optional[str] = None
    message: Optional[str] = None


class ConnectRequestResponse(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    activity: Optional[str]
    message: Optional[str]
    status: str
    created_at: str
    from_user: Optional[UserPublic] = None
    to_user: Optional[UserPublic] = None


class UpdateRequestStatus(BaseModel):
    status: str  # accepted or declined


class SendMessage(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    request_id: str
    sender_id: str
    content: str
    created_at: str
