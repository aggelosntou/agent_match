from sqlmodel import select

from database import get_session, create_db_and_tables
from models import User


def seed_users():
    create_db_and_tables()
    
    sample_users = [
        User(
            name="Alice",
            interests=["basketball", "tennis"],
            location="Monastiraki",
            skill_level="intermediate",
            availability=["tonight", "tomorrow"],
        ),
        User(
            name="Bob",
            interests=["basketball"],
            location="Monastiraki",
            skill_level="beginner",
            availability=["tonight"],
        ),
        User(
            name="Charlie",
            interests=["football"],
            location="Athens",
            skill_level="advanced",
            availability=["tomorrow"],
        ),
        User(
            name="Diana",
            interests=["basketball"],
            location="Monastiraki",
            skill_level="intermediate",
            availability=["tonight"],
        ),
        User(
            name="Ethan",
            interests=["basketball", "football"],
            location="Athens",
            skill_level="advanced",
            availability=["tonight", "tomorrow"],
        ),
        User(
            name="Fiona",
            interests=["tennis"],
            location="Piraeus",
            skill_level="beginner",
            availability=["tonight"],
        ),
        User(
            name="George",
            interests=["basketball"],
            location="Monastiraki",
            skill_level="intermediate",
            availability=["tomorrow"],
        ),
        User(
            name="Helen",
            interests=["basketball", "tennis"],
            location="Monastiraki",
            skill_level="advanced",
            availability=["tonight"],
        ),
        User(
            name="Ivan",
            interests=["football"],
            location="Athens",
            skill_level="intermediate",
            availability=["tomorrow"],
        ),
        User(
            name="Julia",
            interests=["basketball"],
            location="Piraeus",
            skill_level="intermediate",
            availability=["tonight", "tomorrow"],
        ),
    ]

    with get_session() as session:
        existing_users = session.exec(select(User)).all()

        if existing_users:
            print("Database already has users. Skipping seed.")
            return

        for user in sample_users:
            session.add(user)

        session.commit()
        print("Seeded sample users.")


if __name__ == "__main__":
    seed_users()