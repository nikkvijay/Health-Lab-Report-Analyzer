#!/usr/bin/env python3
"""
Script to generate a cryptographically secure JWT secret key
"""
import secrets
import string

def generate_secure_secret_key(length: int = 64) -> str:
    """Generate a cryptographically secure secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    secret_key = generate_secure_secret_key()
    print("Generated secure JWT secret key:")
    print(secret_key)
    print("\nAdd this to your .env file:")
    print(f"SECRET_KEY={secret_key}")