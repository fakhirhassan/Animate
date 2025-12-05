#!/usr/bin/env python3
"""
Database Setup Script for AniMate
This script tests the Supabase connection and checks if required tables exist.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_connection():
    """Test Supabase connection"""
    print("=" * 60)
    print("SUPABASE DATABASE SETUP & VERIFICATION")
    print("=" * 60)
    print()

    # Get credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')

    print("📋 Checking environment variables...")
    if not supabase_url:
        print("❌ SUPABASE_URL not found in .env file")
        return False
    if not supabase_key:
        print("❌ SUPABASE_KEY not found in .env file")
        return False

    print(f"✅ SUPABASE_URL: {supabase_url}")
    print(f"✅ SUPABASE_KEY: {supabase_key[:20]}...")
    print()

    # Test connection
    print("🔌 Testing Supabase connection...")
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Successfully connected to Supabase!")
        print()
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {str(e)}")
        return False

    # Check if tables exist
    print("🔍 Checking database tables...")
    tables_to_check = ['users', 'conversions', 'projects']

    all_tables_exist = True
    for table_name in tables_to_check:
        try:
            # Try to select from the table
            result = supabase.table(table_name).select('*').limit(1).execute()
            print(f"✅ Table '{table_name}' exists")
        except Exception as e:
            print(f"❌ Table '{table_name}' does NOT exist or is not accessible")
            print(f"   Error: {str(e)}")
            all_tables_exist = False

    print()

    if not all_tables_exist:
        print("⚠️  SETUP REQUIRED:")
        print("=" * 60)
        print("Some tables are missing. Please follow these steps:")
        print()
        print("1. Go to your Supabase project dashboard:")
        print(f"   {supabase_url.replace('.supabase.co', '')}/project/_/sql")
        print()
        print("2. Open the SQL Editor")
        print()
        print("3. Copy the contents of 'database_schema.sql' and run it")
        print(f"   File location: {os.path.join(os.path.dirname(__file__), 'database_schema.sql')}")
        print()
        print("4. Re-run this script to verify the setup")
        print("=" * 60)
        return False

    # Test user query
    print("👥 Testing user queries...")
    try:
        users = supabase.table('users').select('id, email, name, role').execute()
        user_count = len(users.data) if users.data else 0
        print(f"✅ Found {user_count} users in the database")

        if user_count > 0:
            print("\n📝 Sample users:")
            for user in users.data[:5]:
                print(f"   - {user.get('name')} ({user.get('email')}) - Role: {user.get('role')}")
    except Exception as e:
        print(f"⚠️  Could not query users: {str(e)}")

    print()

    # Test conversions query
    print("🔄 Testing conversions queries...")
    try:
        conversions = supabase.table('conversions').select('id, file_name, created_at').execute()
        conversion_count = len(conversions.data) if conversions.data else 0
        print(f"✅ Found {conversion_count} conversions in the database")

        if conversion_count > 0:
            print("\n📝 Recent conversions:")
            for conv in conversions.data[:5]:
                print(f"   - {conv.get('file_name')} (Created: {conv.get('created_at')})")
    except Exception as e:
        print(f"⚠️  Could not query conversions: {str(e)}")

    print()
    print("=" * 60)
    print("✅ DATABASE SETUP COMPLETE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Start your backend server: cd backend && python3 app.py")
    print("2. Start your frontend: cd frontend && npm run dev")
    print("3. Test the 2D to 3D conversion")
    print()

    return True


if __name__ == '__main__':
    try:
        success = test_connection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
