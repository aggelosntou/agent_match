from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "sqlite:///agent_match.db"

engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    return Session(engine)