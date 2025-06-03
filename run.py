#!/usr/bin/env python3
"""
Development server runner for Fastapi-Starter project.
Starts both backend (FastAPI) and frontend (simple HTTP server) simultaneously.
"""

import subprocess
import sys
import time
from pathlib import Path


def run_servers():
    """Run both backend and frontend servers."""
    backend_process = None
    frontend_process = None

    try:
        print("🚀 Starting Fastapi-Starter project development servers...")
        print("=" * 50)

        # Get project root directory
        project_root = Path(__file__).parent
        backend_dir = project_root / "backend"
        frontend_dir = project_root / "frontend"

        # Start backend server
        print("📡 Starting backend server (FastAPI on port 8000)...")
        backend_process = subprocess.Popen(
            [sys.executable, "run.py"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
        )

        # Give backend time to start
        time.sleep(2)

        # Start frontend server
        print("🌐 Starting frontend server (HTTP on port 3000)...")
        frontend_process = subprocess.Popen(
            [sys.executable, "server.py"],
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
        )

        print("=" * 50)
        print("✅ Both servers started successfully!")
        print()
        print("🔗 Available endpoints:")
        print("   Backend API:  http://localhost:8000")
        print("   Frontend:     http://localhost:3000")
        print("   API Docs:     http://localhost:8000/docs")
        print("   Health Check: http://localhost:8000/health")
        print()
        print("Press Ctrl+C to stop both servers")
        print("=" * 50)

        # Monitor processes
        while True:
            # Check if backend is still running
            backend_poll = backend_process.poll()
            if backend_poll is not None:
                print(f"❌ Backend process exited with code {backend_poll}")
                break

            # Check if frontend is still running
            frontend_poll = frontend_process.poll()
            if frontend_poll is not None:
                print(f"❌ Frontend process exited with code {frontend_poll}")
                break

            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        # Clean up processes
        if backend_process:
            try:
                backend_process.terminate()
                backend_process.wait(timeout=5)
                print("✅ Backend server stopped")
            except subprocess.TimeoutExpired:
                backend_process.kill()
                print("🔥 Backend server forcefully killed")
            except Exception as e:
                print(f"⚠️  Error stopping backend: {e}")

        if frontend_process:
            try:
                frontend_process.terminate()
                frontend_process.wait(timeout=5)
                print("✅ Frontend server stopped")
            except subprocess.TimeoutExpired:
                frontend_process.kill()
                print("🔥 Frontend server forcefully killed")
            except Exception as e:
                print(f"⚠️  Error stopping frontend: {e}")

        print("👋 Goodbye!")


def main():
    """Main entry point."""
    print("Fastapi-Starter Project Development Server Runner")
    print("=" * 50)

    # Check if required directories exist
    backend_dir = Path(__file__).parent / "backend"
    frontend_dir = Path(__file__).parent / "frontend"

    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        sys.exit(1)

    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        sys.exit(1)

    if not (backend_dir / "run.py").exists():
        print("❌ Backend run.py not found!")
        sys.exit(1)

    if not (frontend_dir / "server.py").exists():
        print("❌ Frontend server.py not found!")
        sys.exit(1)

    run_servers()


if __name__ == "__main__":
    main()
