from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router


app = FastAPI(
    title="NeuroAgent-PD API",
    description="Dockerized multi-agent Parkinson's clinical decision-support MVP",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "NeuroAgent-PD backend is running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }