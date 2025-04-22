import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, Depends, Body
from pydantic import EmailStr, BaseModel
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import smtplib
from email.message import EmailMessage

from db.models_db import SessionLocal, User
from auth.auth import SECRET_KEY, ALGORITHM

router = APIRouter()

# === Shared token logic ===
def create_email_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.JWTError:
        return None

# === Email sending helpers ===
def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = os.getenv("EMAIL_FROM")
    msg["To"] = to
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login(os.getenv("EMAIL_FROM"), os.getenv("EMAIL_PASSWORD"))
            smtp.send_message(msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

def send_verification_email(to_email: str, token: str):
    link = f"http://localhost:8000/auth/verify-email?token={token}"
    body = f"Hi,\n\nClick below to verify your email:\n{link}\n\nIf you didn't request this, ignore it."
    send_email(to_email, "Verify Your Email", body)

def send_password_reset_email(to_email: str, token: str):
    link = f"http://localhost:8000/auth/reset-password?token={token}"
    body = f"Hi,\n\nClick below to reset your password:\n{link}\n\nIf you didn't request this, ignore it."
    send_email(to_email, "Reset Your Password", body)

# === Schemas ===
class EmailRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    new_username: str = None
    new_email: EmailStr = None

# === Routes ===

@router.post("/auth/send-verification")
def request_verification(data: EmailRequest = Body(...)):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.is_verified:
            return {"message": "User is already verified"}
        token = create_email_verification_token(user.email)
        send_verification_email(user.email, token)
        return {"message": "Verification email sent"}
    finally:
        db.close()

@router.get("/auth/verify-email")
def verify_email(token: str = Query(...)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_verified = True
        db.commit()
        return {"message": "Email verified successfully"}
    finally:
        db.close()

@router.post("/auth/forgot-password")
def forgot_password(data: EmailRequest = Body(...)):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        token = create_email_verification_token(user.email)
        send_password_reset_email(user.email, token)
        return {"message": "Password reset link sent"}
    finally:
        db.close()

@router.post("/auth/reset-password")
def reset_password(data: ResetPasswordRequest = Body(...)):
    email = decode_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.hashed_password = data.new_password  # No hashing for now
        db.commit()
        return {"message": "Password updated successfully"}
    finally:
        db.close()

@router.post("/auth/update-profile")
def update_profile(data: UpdateProfileRequest = Body(...), token: str = Query(...)):
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if data.new_username:
            user.username = data.new_username
        if data.new_email:
            user.email = data.new_email
            user.is_verified = False
            token = create_email_verification_token(user.email)
            send_verification_email(user.email, token)

        db.commit()
        return {"message": "Profile updated successfully"}
    finally:
        db.close()
