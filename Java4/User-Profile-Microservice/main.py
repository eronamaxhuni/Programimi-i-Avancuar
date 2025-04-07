from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
import bcrypt
import uuid
import os
from datetime import datetime, timedelta

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Initialize FastAPI app
app = FastAPI()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# In-memory user storage
users = []

# ===== MODELS =====
class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    hashed_password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str]
    password: Optional[str]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ===== HELPER FUNCTIONS =====
def find_user_by_email(email: str) -> Optional[User]:
    return next((user for user in users if user.email == email), None)

def find_user_by_id(user_id: str) -> Optional[User]:
    return next((user for user in users if user.id == user_id), None)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        user = find_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=403, detail="Invalid token")

# ===== ROUTES =====

@app.get("/health")
def health_check():
    return {"status": "UP", "service": "user-profile-service"}

@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    if find_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(id=str(uuid.uuid4()), name=user.name, email=user.email, hashed_password=hashed_pw)
    users.append(new_user)
    return {"id": new_user.id, "email": new_user.email, "name": new_user.name}

@app.get("/users/{user_id}")
def get_user_by_id(user_id: str, current_user: User = Depends(get_current_user)):
    user = find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email}

@app.put("/users/{user_id}")
def update_user(user_id: str, update: UserUpdate, current_user: User = Depends(get_current_user)):
    user = find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to update this user")

    if update.name:
        user.name = update.name
    if update.password:
        if len(update.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        user.hashed_password = bcrypt.hashpw(update.password.encode(), bcrypt.gensalt()).decode()
    return {"message": "User updated successfully"}

@app.get("/users/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}

@app.post("/auth/login", response_model=Token)
def login(user: UserLogin):
    db_user = find_user_by_email(user.email)
    if not db_user or not bcrypt.checkpw(user.password.encode(), db_user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(data={"sub": db_user.id})
    return {"access_token": token}

