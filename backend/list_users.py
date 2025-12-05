"""
List all users and their roles
"""

from supabase_client.supabase_config import get_supabase

def list_users():
    try:
        supabase = get_supabase()

        print("=" * 60)
        print("ALL USERS IN DATABASE")
        print("=" * 60)

        users = supabase.table('users').select('*').execute()

        if users.data:
            print(f"\nTotal users: {len(users.data)}\n")

            for idx, user in enumerate(users.data, 1):
                print(f"{idx}. {user.get('name', 'No name')}")
                print(f"   Email: {user.get('email')}")
                print(f"   Role: {user.get('role', 'No role')}")
                print(f"   ID: {user.get('id')}")
                print(f"   Created: {user.get('created_at', 'N/A')}")
                print()

            # Count by role
            admins = [u for u in users.data if u.get('role') == 'admin']
            creators = [u for u in users.data if u.get('role') == 'creator']

            print(f"Summary:")
            print(f"  Admins: {len(admins)}")
            print(f"  Creators: {len(creators)}")

        else:
            print("\n❌ No users found!")

        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    list_users()
