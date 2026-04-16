import json
import os
from typing import List, Optional

from groq import Groq
from dotenv import load_dotenv

from models import ParsedPrompt, UserPublic, MatchResult
from data import SKILL_ORDER

load_dotenv()

_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _client


_PARSE_SYSTEM = """\
You are a parser for a social activity matching app. Extract structured intent from a user's natural-language message.

Return ONLY a JSON object with these fields (use null for anything not mentioned):
- "activity": what they want to do (e.g. "basketball", "drinks", "coffee", "hiking", "football") — lowercase, single word or short phrase
- "location": where they want to do it (any city, neighborhood, or area) — properly capitalised
- "skill_level": one of "beginner", "intermediate", "advanced" — null if not mentioned
- "availability": when they want (e.g. "tonight", "tomorrow", "this weekend", "friday evening") — lowercase
- "group_size": total number of people they want in the group including themselves (integer) — null if not mentioned

Examples:
  Input: "Find me 4 people that want to play basketball tonight at Athens"
  Output: {"activity": "basketball", "location": "Athens", "skill_level": null, "availability": "tonight", "group_size": 5}

  Input: "anybody free tonight to have a drink at Monastiraki"
  Output: {"activity": "drinks", "location": "Monastiraki", "skill_level": null, "availability": "tonight", "group_size": null}

  Input: "looking for 2 intermediate tennis players in Barcelona tomorrow"
  Output: {"activity": "tennis", "location": "Barcelona", "skill_level": "intermediate", "availability": "tomorrow", "group_size": 3}

Return ONLY the JSON object, no markdown, no explanation.\
"""


def parse_prompt(prompt: str) -> ParsedPrompt:
    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=256,
            messages=[
                {"role": "system", "content": _PARSE_SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
        raw = response.choices[0].message.content.strip()
        data = json.loads(raw)
        return ParsedPrompt(
            activity=data.get("activity"),
            location=data.get("location"),
            skill_level=data.get("skill_level"),
            availability=data.get("availability"),
            group_size=data.get("group_size"),
        )
    except Exception:
        return ParsedPrompt()


def score_user(user: UserPublic, parsed: ParsedPrompt) -> int:
    score = 0

    if parsed.activity is not None:
        for interest in user.interests:
            if parsed.activity.lower() in interest.lower() or interest.lower() in parsed.activity.lower():
                score += 3
                break

    if parsed.location is not None and parsed.location.lower() == user.location.lower():
        score += 2

    if parsed.skill_level is not None and parsed.skill_level == user.skill_level:
        score += 2

    if parsed.availability is not None:
        for slot in user.availability:
            if parsed.availability.lower() in slot.lower() or slot.lower() in parsed.availability.lower():
                score += 2
                break

    return score


def match_users(parsed: ParsedPrompt, users: List[UserPublic]) -> List[MatchResult]:
    if (
        parsed.activity is None
        and parsed.location is None
        and parsed.skill_level is None
        and parsed.availability is None
    ):
        return []

    results: List[MatchResult] = []
    for user in users:
        s = score_user(user, parsed)
        if s > 0:
            results.append(MatchResult(user=user, score=s))

    results.sort(key=lambda x: x.score, reverse=True)
    return results


def skill_distance(requested_skill: Optional[str], user_skill: str) -> int:
    if requested_skill is None:
        return 0
    rv = SKILL_ORDER.get(requested_skill)
    uv = SKILL_ORDER.get(user_skill)
    if rv is None or uv is None:
        return 99
    return abs(rv - uv)


def select_group(matches: List[MatchResult], parsed: ParsedPrompt) -> List[UserPublic]:
    if parsed.group_size is None or parsed.group_size <= 1:
        return []

    needed = parsed.group_size - 1
    strong = [m for m in matches if m.score >= 5]
    strong.sort(key=lambda m: (skill_distance(parsed.skill_level, m.user.skill_level), -m.score))
    return [m.user for m in strong[:needed]]
