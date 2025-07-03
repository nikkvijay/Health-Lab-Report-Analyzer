from setuptools import setup, find_packages

setup(
    name="korai-health-api",
    version="1.0.0",
    description="Health Lab Report Analyzer API",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn[standard]>=0.24.0",
        "python-multipart>=0.0.6",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "pytesseract>=0.3.10",
        "PyPDF2>=3.0.1",
        "Pillow>=10.1.0",
        "python-dotenv>=1.0.0",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "google-auth>=2.23.4",
        "google-auth-oauthlib>=1.1.0",
        "httpx>=0.25.2",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
        ]
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Healthcare Industry",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)