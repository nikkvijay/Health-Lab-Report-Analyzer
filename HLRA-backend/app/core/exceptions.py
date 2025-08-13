from fastapi import HTTPException, status

class FileUploadError(HTTPException):
    def __init__(self, detail: str = "File upload failed"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class ValidationError(HTTPException):
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )

class AuthenticationError(Exception):
    """Exception raised for authentication errors"""
    pass