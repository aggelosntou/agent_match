from typing import List, Optional

from models import ParsedPrompt, User, MatchResult
from data import (
    KNOWN_ACTIVITIES,
    KNOWN_LOCATIONS,
    KNOWN_SKILL_LEVELS,
    KNOWN_AVAILABILITY,
    SKILL_ORDER,
)


def parse_prompt(prompt: str) -> ParsedPrompt:
    text = prompt.lower()

    activity = None
    location = None
    skill_level = None
    availability = None
    group_size = None

    if "this evening" in text:
        text = text.replace("this evening", "tonight")

    if "advanced players" in text:
        text = text.replace("advanced players", "advanced")

    if "intermediate players" in text:
        text = text.replace("intermediate players", "intermediate")

    if "beginner players" in text:
        text = text.replace("beginner players", "beginner")

    for act in KNOWN_ACTIVITIES:
        if act in text:
            activity = act

    for loc in KNOWN_LOCATIONS:
        if loc in text:
            location = loc.capitalize()

    for skill in KNOWN_SKILL_LEVELS:
        if skill in text:
            skill_level = skill

    for time_word in KNOWN_AVAILABILITY:
        if time_word in text:
            availability = time_word

    words = text.split()

    for i, word in enumerate(words):
        if word == "need" and i + 1 < len(words) and words[i + 1].isdigit():
            group_size = int(words[i + 1]) + 1
            break

        if word.isdigit() and group_size is None:
            group_size = int(word)

    return ParsedPrompt(
        activity=activity,
        location=location,
        skill_level=skill_level,
        availability=availability,
        group_size=group_size,
    )


def score_user(user: User, parsed: ParsedPrompt) -> int:
    score = 0

    if parsed.activity is not None and parsed.activity in user.interests:
        score += 3

    if parsed.location is not None and parsed.location.lower() == user.location.lower():
        score += 2

    if parsed.skill_level is not None and parsed.skill_level == user.skill_level:
        score += 2

    if parsed.availability is not None and parsed.availability in user.availability:
        score += 2

    return score


def match_users(parsed: ParsedPrompt, users: List[User]) -> List[MatchResult]:
    if (
        parsed.activity is None
        and parsed.location is None
        and parsed.skill_level is None
        and parsed.availability is None
    ):
        return []

    results: List[MatchResult] = []

    for user in users:
        score = score_user(user, parsed)
        if score > 0:
            results.append(MatchResult(user=user, score=score))

    results.sort(key=lambda x: x.score, reverse=True)
    return results


def skill_distance(requested_skill: Optional[str], user_skill: str) -> int:
    if requested_skill is None:
        return 0

    requested_value = SKILL_ORDER.get(requested_skill)
    user_value = SKILL_ORDER.get(user_skill)

    if requested_value is None or user_value is None:
        return 99

    return abs(requested_value - user_value)


def select_group(matches: List[MatchResult], parsed: ParsedPrompt) -> List[User]:
    if parsed.group_size is None or parsed.group_size <= 1:
        return []

    needed_people = parsed.group_size - 1
    min_score = 7

    strong_matches = [match for match in matches if match.score >= min_score]
    strong_matches.sort(
        key=lambda match: (
            skill_distance(parsed.skill_level, match.user.skill_level),
            -match.score,
        )
    )

    return [match.user for match in strong_matches[:needed_people]]