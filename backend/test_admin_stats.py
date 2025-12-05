"""
Test admin stats service directly
"""

from services.admin_stats_service import AdminStatsService

def test_admin_stats():
    try:
        print("=" * 60)
        print("TESTING ADMIN STATS SERVICE")
        print("=" * 60)

        admin_service = AdminStatsService()

        # Test get_system_stats
        print("\n1. Testing get_system_stats()...")
        stats_result = admin_service.get_system_stats()
        print(f"   Success: {stats_result.get('success')}")
        if stats_result.get('success'):
            data = stats_result.get('data', {})
            print(f"   Total Users: {data.get('totalUsers')}")
            print(f"   Active Users: {data.get('activeUsers')}")
            print(f"   Total Projects: {data.get('totalProjects')}")
            print(f"   System Health: {data.get('systemHealth')}")
        else:
            print(f"   Error: {stats_result.get('message')}")
            print(f"   Details: {stats_result.get('error')}")

        # Test get_conversion_activity
        print("\n2. Testing get_conversion_activity()...")
        activity_result = admin_service.get_conversion_activity(days=7)
        print(f"   Success: {activity_result.get('success')}")
        if activity_result.get('success'):
            data = activity_result.get('data', [])
            print(f"   Activity data points: {len(data)}")
            for day_data in data:
                print(f"   - {day_data.get('day')}: {day_data.get('conversions')} conversions")
        else:
            print(f"   Error: {activity_result.get('message')}")
            print(f"   Details: {activity_result.get('error')}")

        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\n❌ Error testing admin stats: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    test_admin_stats()
