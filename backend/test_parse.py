import os
from dotenv import load_dotenv
import asyncio
from google import genai

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Hello world!"
    )
    print("SUCCESS", response.text)
except Exception as e:
    print("ERROR:", e)
