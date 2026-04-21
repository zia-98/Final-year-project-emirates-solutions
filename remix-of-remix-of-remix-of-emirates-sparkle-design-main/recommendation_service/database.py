from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Using a distinct database for screening or sharing? 
# The user asked to merge them, but recommending sharing same sqlite or separate is fine.
# I'll keep it simple and use screening.db to avoid messing with existing recommendation data if any.
SQLALCHEMY_DATABASE_URL = "sqlite:///./screening.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
