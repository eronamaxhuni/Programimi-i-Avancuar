import bcrypt
from app.main import find_user_by_email, create_access_token
from datetime import timedelta

def test_password_hashing():
    pw = "strongpassword"
    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    assert bcrypt.checkpw(pw.encode(), hashed.encode())

def test_create_access_token():
    data = {"sub": "123"}
    token = create_access_token(data, expires_delta=timedelta(minutes=5))
    assert isinstance(token, str)
