from typing import List, Optional
from database import get_supabase
from models import UserPublic


def _to_public(row: dict) -> UserPublic:
    return UserPublic(
        id=row["id"],
        name=row["name"],
        interests=row.get("interests") or [],
        location=row["location"],
        skill_level=row["skill_level"],
        availability=row.get("availability") or [],
        avatar_url=row.get("avatar_url"),
        bio=row.get("bio"),
    )


def get_all_users() -> List[UserPublic]:
    db = get_supabase()
    res = db.table("profiles").select("*").execute()
    return [_to_public(r) for r in res.data]


def get_user_by_id(user_id: str) -> Optional[UserPublic]:
    db = get_supabase()
    res = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not res.data:
        return None
    return _to_public(res.data)


def create_profile(user_id: str, name: str, interests: List[str], location: str,
                   skill_level: str, availability: List[str]) -> UserPublic:
    db = get_supabase()
    row = {
        "id": user_id,
        "name": name,
        "interests": interests,
        "location": location,
        "skill_level": skill_level,
        "availability": availability,
    }
    res = db.table("profiles").insert(row).execute()
    return _to_public(res.data[0])
