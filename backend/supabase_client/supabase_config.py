"""
Supabase Configuration
Handles Supabase client initialization and database operations.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Initialize Supabase client
supabase: Client = None

def init_supabase():
    """Initialize Supabase client"""
    global supabase

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Supabase credentials not found. "
            "Please set SUPABASE_URL and SUPABASE_KEY in your .env file"
        )

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase


def get_supabase() -> Client:
    """Get Supabase client instance"""
    global supabase

    if supabase is None:
        supabase = init_supabase()

    return supabase
