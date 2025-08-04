"""
Authentication utilities for JSON lead processing API
"""

import jwt
import os
from typing import Optional, Dict, Any
from fastapi import HTTPException
from database.supabase_client import get_supabase_client
import logging

logger = logging.getLogger(__name__)

async def verify_user_token(token: str) -> Optional[str]:
    """
    Verify Supabase JWT token and return user ID
    """
    try:
        supabase = get_supabase_client()
        
        # Use Supabase to verify the token
        response = supabase.auth.get_user(token)
        
        if response.user:
            return response.user.id
        else:
            logger.warning("Invalid token - no user found")
            return None
            
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None

async def get_user_api_keys(user_id: str) -> Dict[str, str]:
    """
    Get user's API keys from database
    """
    try:
        supabase = get_supabase_client()
        
        # Fetch user's API keys
        response = supabase.table("user_api_keys").select("*").eq("user_id", user_id).execute()
        
        api_keys = {}
        if response.data:
            for key_record in response.data:
                provider = key_record.get("provider")
                api_key = key_record.get("api_key")
                if provider and api_key:
                    api_keys[provider] = api_key
        
        # Add default environment API keys if user doesn't have them
        env_keys = {
            "openai": os.getenv("OPENAI_API_KEY"),
            "deepseek": os.getenv("DEEPSEEK_API_KEY"),
            "apollo": os.getenv("APOLLO_API_KEY"),
            "pdl": os.getenv("PDL_API_KEY"),
            "clearbit": os.getenv("CLEARBIT_API_KEY"),
            "hunter": os.getenv("HUNTER_API_KEY"),
            "serper": os.getenv("SERPER_API_KEY")
        }
        
        for provider, key in env_keys.items():
            if key and provider not in api_keys:
                api_keys[provider] = key
        
        return api_keys
        
    except Exception as e:
        logger.error(f"Error fetching user API keys: {e}")
        return {}

def get_jwt_secret() -> str:
    """
    Get JWT secret for token verification
    """
    return os.getenv("SUPABASE_JWT_SECRET", "your-jwt-secret")

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode JWT token manually (fallback method)
    """
    try:
        secret = get_jwt_secret()
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None
