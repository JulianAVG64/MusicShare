from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    """Obtiene usuario por email"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    """Obtiene usuario por username"""
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Crea un nuevo usuario"""
    hashed = pwd_context.hash(user.password)
    now = datetime.now(timezone.utc)
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed,
        first_name=user.first_name,
        last_name=user.last_name,
        profile_picture_url=user.profile_picture_url,
        bio=user.bio,
        created_at=now,
        updated_at=now,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain: str, hashed: str):
    """Verifica que la contraseña coincida con el hash"""
    return pwd_context.verify(plain, hashed)

def authenticate_user(db: Session, email: str, password: str):
    """Autentica un usuario con email y contraseña"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user