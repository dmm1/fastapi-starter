#!/usr/bin/env python3
"""
Simple HTTP server to serve the Fastapi-Starter Backend frontend.

Usage:
    python server.py [port]

Default port is 3000.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path


def main():
    # Get port from command line argument or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

    # Change to the frontend directory
    frontend_dir = Path(__file__).parent
    os.chdir(frontend_dir)

    # Create server
    Handler = http.server.SimpleHTTPRequestHandler

    # Add CORS headers for development
    class CORSRequestHandler(Handler):
        def end_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header(
                "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
            )
            self.send_header(
                "Access-Control-Allow-Headers", "Content-Type, Authorization"
            )
            super().end_headers()

        def do_OPTIONS(self):
            self.send_response(200)
            self.end_headers()

    try:
        with socketserver.TCPServer(("", port), CORSRequestHandler) as httpd:
            print(f"🚀 Frontend server starting on http://localhost:{port}")
            print(f"📁 Serving files from: {frontend_dir}")
            print("🎯 Backend API: http://127.0.0.1:8000")
            print(f"📖 Open http://localhost:{port} in your browser")
            print("Press Ctrl+C to stop the server")

            # Try to open browser automatically
            try:
                webbrowser.open(f"http://localhost:{port}")
            except Exception:
                pass

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use. Try a different port:")
            print(f"   python server.py {port + 1}")
        else:
            print(f"❌ Error starting server: {e}")


if __name__ == "__main__":
    main()
