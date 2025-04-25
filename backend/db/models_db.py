from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, Index, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()
DB_PATH = "sqlite:///brd.db"

engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String, nullable=False)
    messages = Column(String, nullable=False)  # Will store the JSON string with all model data
    title = Column(String, nullable=True)  # Optional title for the conversation
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Define the relationship to User
    user = relationship("User", back_populates="chat_histories")
    
    # Create indexes for faster queries
    __table_args__ = (
        Index('idx_conversation_id', conversation_id),
        Index('idx_user_id', user_id),
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    chat_histories = relationship("ChatHistory", back_populates="user")

def init_db():
    Base.metadata.create_all(bind=engine)
