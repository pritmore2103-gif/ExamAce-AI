from hashlib import sha256
from jose import jwt

SECRET_KEY = "examace-secret-key"
ALGORITHM = "HS256"

def hash_password(password):
    return sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return sha256(password.encode()).hexdigest() == hashed

def create_access_token(data):
    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
def decode_access_token(token):
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )
