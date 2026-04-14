from models import User

users_db = [
    User(
        id=1,
        name="Alice",
        interests=["basketball", "tennis"],
        location="Monastiraki",
        skill_level="intermediate",
        availability=["tonight", "tomorrow"],
    ),
    User(
        id=2,
        name="Bob",
        interests=["basketball"],
        location="Monastiraki",
        skill_level="beginner",
        availability=["tonight"],
    ),
    User(
        id=3,
        name="Charlie",
        interests=["football"],
        location="Athens",
        skill_level="advanced",
        availability=["tomorrow"],
    ),
    User(
        id=4,
        name="Diana",
        interests=["basketball"],
        location="Monastiraki",
        skill_level="intermediate",
        availability=["tonight"],
    ),
    User(
        id=5,
        name="Ethan",
        interests=["basketball", "football"],
        location="Athens",
        skill_level="advanced",
        availability=["tonight", "tomorrow"],
    ),
    User(
        id=6,
        name="Fiona",
        interests=["tennis"],
        location="Piraeus",
        skill_level="beginner",
        availability=["tonight"],
    ),
    User(
        id=7,
        name="George",
        interests=["basketball"],
        location="Monastiraki",
        skill_level="intermediate",
        availability=["tomorrow"],
    ),
    User(
        id=8,
        name="Helen",
        interests=["basketball", "tennis"],
        location="Monastiraki",
        skill_level="advanced",
        availability=["tonight"],
    ),
    User(
        id=9,
        name="Ivan",
        interests=["football"],
        location="Athens",
        skill_level="intermediate",
        availability=["tomorrow"],
    ),
    User(
        id=10,
        name="Julia",
        interests=["basketball"],
        location="Piraeus",
        skill_level="intermediate",
        availability=["tonight", "tomorrow"],
    ),
]

KNOWN_ACTIVITIES = ["basketball", "football", "tennis"]
KNOWN_LOCATIONS = ["monastiraki", "athens", "piraeus"]
KNOWN_SKILL_LEVELS = ["beginner", "intermediate", "advanced"]
KNOWN_AVAILABILITY = ["tonight", "tomorrow"]

SKILL_ORDER = {
    "beginner": 0,
    "intermediate": 1,
    "advanced": 2,
}

next_user_id = 11