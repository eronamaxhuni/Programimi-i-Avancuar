# routes/users.py
from fastapi import APIRouter, HTTPException, Depends
from models import User, UserCreate
from database import fake_db
from auth import hash_password, get_current_user
import uuid
from datetime import datetime

router = APIRouter()

# Register User
@router.post("/users", status_code=201)
def create_user(user: UserCreate):
    if user.email in fake_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        id=str(uuid.uuid4()),
        email=user.email,
        name=user.name,
        address=user.address,
        registration_date=datetime.utcnow()
    )
    fake_db[user.email] = {**new_user.dict(), "password": hash_password(user.password)}
    return new_user

# Get Current User Profile
@router.get("/users/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user
