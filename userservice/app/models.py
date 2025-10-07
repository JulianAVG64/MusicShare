# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from .database import Base

# ...existing code...
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(254), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
# ...existing code...