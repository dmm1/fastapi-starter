#!/usr/bin/env python3
"""
Secret key generator for Fastapi-Starter Backend.
Run this script to generate a secure SECRET_KEY for your .env file.
"""

import secrets
import string


def generate_secret_key(length: int = 64) -> str:
    """Generate a cryptographically secure secret key."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
    return "".join(secrets.choice(alphabet) for _ in range(length))


if __name__ == "__main__":
    print("🔐 Fastapi-Starter Secret Key Generator")
    print("=" * 50)

    secret_key = generate_secret_key()

    print(f"Generated SECRET_KEY:")
    print(f"SECRET_KEY={secret_key}")
    print()
    print("💡 Copy this line to your .env file")
    print("⚠️  Keep this key secure and never share it!")
