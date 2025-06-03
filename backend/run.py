"""
Main entry point for the Fastapi-Starter Backend API.
This file imports the FastAPI app from the modular app package.
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
