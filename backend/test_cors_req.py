import requests
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

def run():
    uvicorn.run(app, host="127.0.0.1", port=8000)

thread = threading.Thread(target=run, daemon=True)
thread.start()
time.sleep(1)

resp = requests.options("http://127.0.0.1:8000/", headers={"Origin": "https://crewmindd.netlify.app", "Access-Control-Request-Method": "GET"})
print("Status:", resp.status_code)
print("Body:", resp.text)
print("Headers:", resp.headers)
