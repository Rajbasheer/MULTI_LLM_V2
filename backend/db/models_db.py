from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()
DB_PATH = "sqlite:///brd.db"

engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#class BRDUpload(Base):
#   __tablename__ = "brd_uploads"

#    id = Column(Integer, primary_key=True, index=True)
#    filetype = Column(String, nullable=False)
#    upload_time = Column(DateTime, default=datetime.utcnow)
#    content_preview = Column(Text)
#    full_content = Column(Text)
#    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)
    model_key = Column(String, nullable=False)
    file_id = Column(Integer, nullable=True)
    messages = Column(Text, nullable=False)  # JSON-encoded list
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

def init_db():
    Base.metadata.create_all(bind=engine)
