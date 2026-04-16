from typing import List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from auth import get_anon_client, get_current_user_id
from database import get_supabase
from matcher import parse_prompt, match_users, select_group
from models import (
    ConnectRequest,
    ConnectRequestResponse,
    LoginRequest,
    MatchResponse,
    MessageResponse,
    RegisterRequest,
    Request,
    SendMessage,
    TokenResponse,
    UpdateRequestStatus,
    UserPublic,
)
from repository import create_profile, get_all_users, get_user_by_id

load_dotenv()

app = FastAPI(title="Agent Match API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    client = get_anon_client()
    try:
        res = client.auth.sign_up({"email": req.email, "password": req.password})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not res.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed")

    user_id = res.user.id
    profile = create_profile(
        user_id=user_id,
        name=req.name,
        interests=req.interests,
        location=req.location,
        skill_level=req.skill_level,
        availability=req.availability,
    )

    token = res.session.access_token if res.session else ""
    return TokenResponse(access_token=token, user=profile)


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    client = get_anon_client()
    try:
        res = client.auth.sign_in_with_password({"email": req.email, "password": req.password})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not res.user or not res.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    profile = get_user_by_id(res.user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return TokenResponse(access_token=res.session.access_token, user=profile)


# ── Users ─────────────────────────────────────────────────────────────────────

@app.get("/users/me", response_model=UserPublic)
def get_me(user_id: str = Depends(get_current_user_id)):
    profile = get_user_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@app.get("/users", response_model=List[UserPublic])
def list_users(_: str = Depends(get_current_user_id)):
    return get_all_users()


# ── Match ─────────────────────────────────────────────────────────────────────

@app.post("/match", response_model=MatchResponse)
def match(request: Request, user_id: str = Depends(get_current_user_id)):
    parsed = parse_prompt(request.prompt)
    # Exclude the requesting user from results
    users = [u for u in get_all_users() if u.id != user_id]

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


# ── Connect Requests ──────────────────────────────────────────────────────────

@app.post("/connect", response_model=ConnectRequestResponse, status_code=status.HTTP_201_CREATED)
def send_connect_request(req: ConnectRequest, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()

    if req.to_user_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot connect with yourself")

    existing = db.table("connect_requests").select("id").eq("from_user_id", user_id).eq("to_user_id", req.to_user_id).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request already sent")

    row = {
        "from_user_id": user_id,
        "to_user_id": req.to_user_id,
        "activity": req.activity,
        "message": req.message,
    }
    res = db.table("connect_requests").insert(row).execute()
    data = res.data[0]
    return ConnectRequestResponse(**data)


@app.get("/connect", response_model=List[ConnectRequestResponse])
def list_connect_requests(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    res = db.table("connect_requests").select("*").or_(
        f"from_user_id.eq.{user_id},to_user_id.eq.{user_id}"
    ).order("created_at", desc=True).execute()

    results = []
    for row in res.data:
        from_user = get_user_by_id(row["from_user_id"])
        to_user = get_user_by_id(row["to_user_id"])
        results.append(ConnectRequestResponse(**row, from_user=from_user, to_user=to_user))
    return results


@app.patch("/connect/{request_id}", response_model=ConnectRequestResponse)
def update_connect_request(request_id: str, body: UpdateRequestStatus, user_id: str = Depends(get_current_user_id)):
    if body.status not in ("accepted", "declined"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be accepted or declined")

    db = get_supabase()
    res = db.table("connect_requests").update({"status": body.status}).eq("id", request_id).eq("to_user_id", user_id).execute()

    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return ConnectRequestResponse(**res.data[0])


# ── Messages ──────────────────────────────────────────────────────────────────

@app.get("/connect/{request_id}/messages", response_model=List[MessageResponse])
def get_messages(request_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()

    req = db.table("connect_requests").select("*").eq("id", request_id).single().execute()
    if not req.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    row = req.data
    if row["from_user_id"] != user_id and row["to_user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    res = db.table("messages").select("*").eq("request_id", request_id).order("created_at").execute()
    return [MessageResponse(**m) for m in res.data]


@app.post("/connect/{request_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(request_id: str, body: SendMessage, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()

    req = db.table("connect_requests").select("*").eq("id", request_id).eq("status", "accepted").single().execute()
    if not req.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Accepted request not found")

    row = req.data
    if row["from_user_id"] != user_id and row["to_user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    msg = {"request_id": request_id, "sender_id": user_id, "content": body.content}
    res = db.table("messages").insert(msg).execute()
    return MessageResponse(**res.data[0])
