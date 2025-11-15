"""
AI Chat Endpoints
Health-focused chatbot using Google Gemini AI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.core.auth import get_current_user
from app.models.user import UserInDB
from app.services.ai_chat_service import ai_chat_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Request for chat completion"""
    message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Previous conversation messages for context"
    )


class ChatResponse(BaseModel):
    """Response from chat completion"""
    success: bool
    response: str
    timestamp: str
    has_health_context: bool = Field(
        default=False,
        description="Whether user's health data was used for context"
    )
    error: Optional[str] = None


class ConversationHistoryResponse(BaseModel):
    """Response containing conversation history"""
    messages: List[ChatMessage]
    total: int


@router.post("/ask", response_model=ChatResponse)
async def ask_health_question(
    request: ChatRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Ask a health-related question to the AI assistant

    The AI will use your health data and family profiles to provide
    personalized, context-aware responses.

    **Note**: This is for informational purposes only and does not
    replace professional medical advice.
    """
    try:
        user_id = str(current_user.id)

        # Get AI response
        result = await ai_chat_service.chat(
            user_id=user_id,
            message=request.message,
            conversation_history=request.conversation_history
        )

        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to process chat request")
            )

        return ChatResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process your question: {str(e)}"
        )


@router.get("/history", response_model=ConversationHistoryResponse)
async def get_chat_history(
    limit: int = 50,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Retrieve conversation history with the AI assistant

    Returns the most recent conversations in chronological order.
    """
    try:
        user_id = str(current_user.id)

        messages = await ai_chat_service.get_conversation_history(
            user_id=user_id,
            limit=limit
        )

        return ConversationHistoryResponse(
            messages=[ChatMessage(**msg) for msg in messages],
            total=len(messages)
        )

    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversation history"
        )


@router.delete("/history")
async def clear_chat_history(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Clear all conversation history with the AI assistant

    This action cannot be undone.
    """
    try:
        user_id = str(current_user.id)

        success = await ai_chat_service.clear_conversation_history(user_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No conversation history found"
            )

        return {
            "success": True,
            "message": "Conversation history cleared successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear conversation history"
        )


@router.get("/suggestions")
async def get_chat_suggestions(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get suggested questions based on user's health data

    Returns a list of relevant questions the user might want to ask.
    """
    return {
        "suggestions": [
            "What do my recent lab results mean?",
            "How has my cholesterol changed over time?",
            "What is a normal range for blood sugar?",
            "Should I be concerned about any of my results?",
            "What lifestyle changes might help improve my health metrics?",
            "Can you explain what HDL and LDL cholesterol are?",
            "How do my results compare to normal ranges?",
            "What health metrics should I track regularly?"
        ]
    }


@router.get("/health-check")
async def chat_health_check():
    """
    Check if the chat service is operational
    """
    try:
        from app.core.config import settings

        has_api_key = bool(settings.gemini_api_key)

        return {
            "status": "healthy" if has_api_key else "no_api_key",
            "service": "ai_chat",
            "gemini_configured": has_api_key,
            "message": "Chat service is ready" if has_api_key else "Gemini API key not configured"
        }
    except Exception as e:
        return {
            "status": "error",
            "service": "ai_chat",
            "error": str(e)
        }
