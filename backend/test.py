import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

email = os.getenv("EMAIL_FROM")
password = os.getenv("EMAIL_PASSWORD")

try:
    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(email, password)
        print("Login successful")
except Exception as e:
    print("Login failed:", e)
