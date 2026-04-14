from typing import List
from sqlmodel import select

from database import get_session
from models import User


def get_all_users() -> List[User]:
    with get_session() as session:
        return session.exec(select(User)).all()


def create_user_in_db(user: User) -> User:
    with get_session() as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user