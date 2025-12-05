"""
Quick script to check conversions in the database
"""

from supabase_client.supabase_config import get_supabase

def check_conversions():
    try:
        supabase = get_supabase()

        print("=" * 60)
        print("CHECKING CONVERSIONS TABLE")
        print("=" * 60)

        # Check total conversions
        response = supabase.table('conversions').select('*').execute()

        print(f"\nTotal conversions in database: {len(response.data) if response.data else 0}")

        if response.data:
            print("\nConversions found:")
            for idx, conversion in enumerate(response.data, 1):
                print(f"\n{idx}. ID: {conversion.get('id')}")
                print(f"   User ID: {conversion.get('user_id')}")
                print(f"   File Name: {conversion.get('file_name')}")
                print(f"   Status: {conversion.get('status')}")
                print(f"   Created: {conversion.get('created_at')}")
        else:
            print("\n⚠️  No conversions found in the database!")
            print("\nPossible reasons:")
            print("1. Conversions are not being saved when users upload 2D images")
            print("2. Database save is failing silently")
            print("3. The conversions table doesn't exist")

        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\n❌ Error checking conversions: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    check_conversions()
