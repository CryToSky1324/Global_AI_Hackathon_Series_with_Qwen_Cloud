import os

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.routes_chat import router as chat_router
from fast_core.logging_config import setup_logging
from api.routes_session import router as session_router
from persistence import init_db

setup_logging()
init_db()

app = FastAPI(title="Business Agent swarm society backend")

default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://47.245.99.13:3000",
    "https://global-ai-hackathon-series-with-qwen-clo-crytosky1324s-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(session_router, prefix="/api")
