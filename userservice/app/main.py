# app/main.py
from fastapi import FastAPI
from .database import engine, Base
from .routers import auth_router, users_router, proxy_router
from fastapi.middleware.cors import CORSMiddleware
from . import models

app = FastAPI(title="Users Service - MusicShare")

origins = [
    "http://localhost:3000",  # frontend
    "http://127.0.0.1:5173",  # opcional
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # ["*"] para permitir todos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# create tables at startup (simple approach; replace with migrations for production)
Base.metadata.create_all(bind=engine)

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(proxy_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
