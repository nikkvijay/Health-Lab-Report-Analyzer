"""
AI Chat Service using Google Gemini API
Provides health-related chat functionality with context from user's health data
Uses REST API approach (same as AMS-Backend)
"""

import aiohttp
from typing import Dict, List, Optional, Any
from app.core.config import settings
from app.database.connection import get_database
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AIChatService:
    """Service for AI-powered health chat"""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        # Using Gemini 2.5 Flash - faster and more efficient
        # Fallback to gemini-2.0-flash-exp, gemini-1.5-flash, or gemini-pro if not available
        self.model_name = "gemini-2.5-flash"
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        
        if not self.api_key:
            logger.warning("Gemini API key not configured")
        else:
            logger.info(f"Gemini API configured with REST API endpoint using model: {self.model_name}")

    async def get_user_health_context(self, user_id: str) -> str:
        """
        Fetch user's health data to provide context to the AI
        """
        try:
            # Get database and health data collection
            db = await get_database()
            health_data_collection = db.health_data
            reports = await health_data_collection.find(
                {"user_id": user_id}
            ).sort("report_date", -1).limit(5).to_list(length=5)

            if not reports:
                return "No health reports available for this user yet."

            # Build context string
            context_parts = [
                "User's Recent Health Data:",
                "=" * 50
            ]

            for i, report in enumerate(reports, 1):
                report_date = report.get("report_date", "Unknown date")
                metrics = report.get("metrics", {})

                context_parts.append(f"\nReport #{i} - Date: {report_date}")

                if metrics:
                    for metric_name, metric_value in metrics.items():
                        context_parts.append(f"  - {metric_name}: {metric_value}")

            context_parts.append("\n" + "=" * 50)

            return "\n".join(context_parts)

        except Exception as e:
            logger.error(f"Error fetching health context: {str(e)}")
            return "Unable to fetch health data at this time."

    async def get_family_profiles_context(self, user_id: str) -> str:
        """Get family profiles context"""
        try:
            db = await get_database()
            family_profiles_collection = db.family_profiles
            profiles = await family_profiles_collection.find(
                {"user_id": user_id}
            ).to_list(length=10)

            if not profiles:
                return ""

            context_parts = ["\nFamily Profiles:"]
            for profile in profiles:
                name = profile.get("name", "Unknown")
                relationship = profile.get("relationship", "Unknown")
                conditions = profile.get("medical_conditions", [])

                profile_info = f"- {name} ({relationship})"
                if conditions:
                    profile_info += f" - Conditions: {', '.join(conditions)}"
                context_parts.append(profile_info)

            return "\n".join(context_parts)

        except Exception as e:
            logger.error(f"Error fetching family profiles: {str(e)}")
            return ""

    async def _is_available(self) -> bool:
        """Check if Gemini API is available"""
        if not self.api_key or self.api_key == "":
            return False
        
        # Try to check availability with the primary model
        try:
            async with aiohttp.ClientSession() as session:
                test_url = f"{self.base_url}?key={self.api_key}"
                async with session.post(
                    test_url,
                    json={"contents": [{"parts": [{"text": "Hello"}]}]},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    return response.status == 200
        except Exception as e:
            logger.warning(f"Gemini API not available with {self.model_name}: {e}")
            return False

    async def _make_request(self, prompt: str) -> Optional[str]:
        """Make request to Gemini API using REST endpoint with fallback to gemini-1.5-flash"""
        if not await self._is_available():
            return None
        
        # Try primary model first, then fallback models
        models_to_try = [
            self.model_name,  # gemini-2.5-flash
            "gemini-2.0-flash-exp",  # Experimental 2.0
            "gemini-1.5-flash",  # Stable 1.5
            "gemini-pro"  # Original
        ]
        
        for model in models_to_try:
            try:
                base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                async with aiohttp.ClientSession() as session:
                    url = f"{base_url}?key={self.api_key}"
                    payload = {
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }],
                        "generationConfig": {
                            "temperature": 0.7,
                            "topK": 40,
                            "topP": 0.95,
                            "maxOutputTokens": 2048
                        }
                    }
                    
                    async with session.post(
                        url,
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            if "candidates" in result and len(result["candidates"]) > 0:
                                if model != self.model_name:
                                    logger.info(f"Using fallback model: {model}")
                                return result["candidates"][0]["content"]["parts"][0]["text"]
                        else:
                            error_text = await response.text()
                            if model == models_to_try[-1]:  # Last model, log error
                                logger.error(f"Gemini API error with {model}: {response.status} - {error_text}")
                            else:
                                logger.warning(f"Model {model} failed, trying next...")
                                continue
            except Exception as e:
                if model == models_to_try[-1]:  # Last model, log error
                    logger.error(f"Error calling Gemini API with {model}: {e}", exc_info=True)
                else:
                    logger.warning(f"Error with model {model}, trying next: {e}")
                    continue
        
        return None

    def create_system_prompt(self, health_context: str, family_context: str) -> str:
        """
        Create a comprehensive system prompt for the AI
        """
        system_prompt = f"""You are a helpful and empathetic health assistant for the Health Lab Report Analyzer (HLRA) application.

Your role is to:
1. Help users understand their health reports and lab results
2. Explain medical terms in simple, easy-to-understand language
3. Provide general health information and guidance
4. Answer questions about health trends and metrics
5. Suggest when users should consult with healthcare professionals

IMPORTANT GUIDELINES:
- Always be empathetic and supportive
- Never provide medical diagnosis or treatment recommendations
- Always recommend consulting with healthcare professionals for medical decisions
- Use simple, non-technical language when possible
- If you don't know something, admit it and suggest consulting a doctor
- Focus on education and understanding, not diagnosis
- Respect patient privacy and confidentiality

{health_context}

{family_context}

When answering questions:
- Reference the user's actual health data when relevant
- Explain what normal ranges are for various metrics
- Highlight any trends you notice in their data
- Always end with encouragement and positive reinforcement
"""
        return system_prompt

    async def chat(
        self,
        user_id: str,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and return AI response

        Args:
            user_id: User's unique identifier
            message: User's message
            conversation_history: Previous conversation messages

        Returns:
            Dict with response and metadata
        """
        try:
            if not self.api_key:
                raise Exception("Gemini API key not configured")

            # Get user's health context
            health_context = await self.get_user_health_context(user_id)
            family_context = await self.get_family_profiles_context(user_id)

            # Create system prompt
            system_prompt = self.create_system_prompt(health_context, family_context)

            # Build conversation history context
            history_context = ""
            if conversation_history:
                recent_messages = conversation_history[-5:]  # Last 5 messages
                history_parts = []
                for msg in recent_messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if content.strip():
                        history_parts.append(f"{role.capitalize()}: {content}")
                if history_parts:
                    history_context = "\n\nPrevious conversation:\n" + "\n".join(history_parts)

            # Prepare the full prompt with system context and history
            full_prompt = f"{system_prompt}{history_context}\n\nUser Question: {message}"

            # Get AI response using REST API
            response_text = await self._make_request(full_prompt)

            if not response_text:
                raise Exception("Failed to get response from Gemini API")

            # Store conversation in database for history
            await self._store_conversation(
                user_id=user_id,
                user_message=message,
                ai_response=response_text
            )

            return {
                "success": True,
                "response": response_text.strip(),
                "timestamp": datetime.utcnow().isoformat(),
                "has_health_context": bool(health_context and "No health reports" not in health_context)
            }

        except Exception as e:
            logger.error(f"Error in chat service: {str(e)}", exc_info=True)
            error_message = str(e)
            
            # Provide more specific error messages
            if "API key" in error_message or "authentication" in error_message.lower():
                error_message = "Gemini API authentication failed. Please check API key configuration."
            elif "quota" in error_message.lower() or "rate limit" in error_message.lower():
                error_message = "API rate limit exceeded. Please try again later."
            elif "safety" in error_message.lower():
                error_message = "Request was blocked by safety filters. Please rephrase your question."
            
            return {
                "success": False,
                "error": error_message,
                "response": "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
            }

    async def _store_conversation(
        self,
        user_id: str,
        user_message: str,
        ai_response: str
    ):
        """Store conversation in database for history"""
        try:
            db = await get_database()
            chat_history_collection = db.chat_history

            conversation_entry = {
                "user_id": user_id,
                "messages": [
                    {
                        "role": "user",
                        "content": user_message,
                        "timestamp": datetime.utcnow()
                    },
                    {
                        "role": "assistant",
                        "content": ai_response,
                        "timestamp": datetime.utcnow()
                    }
                ],
                "created_at": datetime.utcnow()
            }

            await chat_history_collection.insert_one(conversation_entry)

        except Exception as e:
            logger.error(f"Error storing conversation: {str(e)}")

    async def get_conversation_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Retrieve conversation history for a user
        """
        try:
            db = await get_database()
            chat_history_collection = db.chat_history

            conversations = await chat_history_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit).to_list(length=limit)

            # Flatten the conversation structure
            all_messages = []
            for conv in reversed(conversations):  # Reverse to get chronological order
                for msg in conv.get("messages", []):
                    all_messages.append({
                        "role": msg.get("role"),
                        "content": msg.get("content"),
                        "timestamp": msg.get("timestamp").isoformat() if msg.get("timestamp") else None
                    })

            return all_messages

        except Exception as e:
            logger.error(f"Error fetching conversation history: {str(e)}")
            return []

    async def clear_conversation_history(self, user_id: str) -> bool:
        """Clear conversation history for a user"""
        try:
            db = await get_database()
            chat_history_collection = db.chat_history
            result = await chat_history_collection.delete_many({"user_id": user_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error clearing conversation history: {str(e)}")
            return False


# Singleton instance
ai_chat_service = AIChatService()
