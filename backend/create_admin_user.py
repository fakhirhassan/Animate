"""
Create or update a user to be an admin
"""

from supabase_client.supabase_config import get_supabase

def create_admin():
    try:
        supabase = get_supabase()

        print("=" * 60)
        print("CREATING/UPDATING ADMIN USER")
        print("=" * 60)

        email = input("\nEnter email address for admin user: ")

        # Check if user exists
        users = supabase.table('users').select('*').eq('email', email).execute()

        if users.data and len(users.data) > 0:
            # Update existing user to admin
            user = users.data[0]
            print(f"\nFound existing user: {user.get('name')} ({email})")

            result = supabase.table('users').update({
                'role': 'admin'
            }).eq('id', user['id']).execute()

            print(f"\n✅ User updated to admin role!")
            print(f"   ID: {user['id']}")
            print(f"   Name: {user.get('name')}")
            print(f"   Email: {email}")
            print(f"   Role: admin")

        else:
            print(f"\n❌ No user found with email: {email}")
            print("\nThe user must sign up first, then you can make them an admin.")
            print("Please:")
            print("1. Have the user sign up at: http://localhost:3000/signup")
            print("2. Then run this script again with their email")

        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    create_admin()
