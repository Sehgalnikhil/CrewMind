from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

try:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("Success")
except Exception as e:
    print("Error:", e)
