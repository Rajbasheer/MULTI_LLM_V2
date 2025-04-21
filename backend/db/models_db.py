from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()
DB_PATH = "sqlite:///brd.db"

engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class BRDUpload(Base):
    __tablename__ = "brd_uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    content_preview = Column(Text)
    full_content = Column(Text)

def init_db():
    Base.metadata.create_all(bind=engine)
