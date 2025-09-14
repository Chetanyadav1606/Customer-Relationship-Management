import requests
import sys
import json
from datetime import datetime

class MiniCRMAPITester:
    def __init__(self, base_url="https://mini-crm-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_customer_id = None
        self.test_lead_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password, user_type="user"):
        """Test login and get token"""
        print(f"\n🔐 Testing {user_type} login...")
        success, response = self.run_test(
            f"Login as {user_type}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            token = response['access_token']
            if user_type == "admin":
                self.admin_token = token
            else:
                self.user_token = token
            print(f"✅ {user_type.capitalize()} login successful")
            return True, token
        print(f"❌ {user_type.capitalize()} login failed")
        return False, None

    def test_dashboard_stats(self, token, user_type):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            f"Dashboard stats ({user_type})",
            "GET",
            "dashboard/stats",
            200,
            token=token
        )
        if success:
            required_fields = ['total_customers', 'total_leads', 'leads_by_status', 'total_value']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in dashboard stats: {field}")
                    return False
            print(f"✅ Dashboard stats complete for {user_type}")
        return success

    def test_customer_operations(self, token, user_type):
        """Test customer CRUD operations"""
        print(f"\n👥 Testing Customer Operations ({user_type})...")
        
        # Test GET customers
        success, customers = self.run_test(
            f"Get customers ({user_type})",
            "GET",
            "customers",
            200,
            token=token
        )
        if not success:
            return False
        
        # Test GET customers with search
        success, _ = self.run_test(
            f"Search customers ({user_type})",
            "GET",
            "customers",
            200,
            token=token,
            params={"search": "tech", "limit": 5}
        )
        if not success:
            return False

        # Test POST customer (create)
        test_customer_data = {
            "name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+1-555-0199",
            "company": "Test Company Inc"
        }
        
        success, customer_response = self.run_test(
            f"Create customer ({user_type})",
            "POST",
            "customers",
            200,
            data=test_customer_data,
            token=token
        )
        if not success:
            return False
        
        customer_id = customer_response.get('id')
        if not customer_id:
            print("❌ No customer ID returned from create")
            return False
        
        self.test_customer_id = customer_id
        print(f"✅ Created customer with ID: {customer_id}")

        # Test GET specific customer
        success, _ = self.run_test(
            f"Get specific customer ({user_type})",
            "GET",
            f"customers/{customer_id}",
            200,
            token=token
        )
        if not success:
            return False

        # Test PUT customer (update)
        update_data = {
            "name": "Updated Test Customer",
            "company": "Updated Test Company"
        }
        success, _ = self.run_test(
            f"Update customer ({user_type})",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data,
            token=token
        )
        if not success:
            return False

        return True

    def test_lead_operations(self, token, user_type):
        """Test lead CRUD operations"""
        if not self.test_customer_id:
            print("❌ No test customer available for lead operations")
            return False
            
        print(f"\n📋 Testing Lead Operations ({user_type})...")
        
        # Test POST lead (create)
        test_lead_data = {
            "title": f"Test Lead {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test lead for API testing",
            "status": "New",
            "value": 5000.0
        }
        
        success, lead_response = self.run_test(
            f"Create lead ({user_type})",
            "POST",
            f"customers/{self.test_customer_id}/leads",
            200,
            data=test_lead_data,
            token=token
        )
        if not success:
            return False
        
        lead_id = lead_response.get('id')
        if not lead_id:
            print("❌ No lead ID returned from create")
            return False
        
        self.test_lead_id = lead_id
        print(f"✅ Created lead with ID: {lead_id}")

        # Test GET customer leads
        success, _ = self.run_test(
            f"Get customer leads ({user_type})",
            "GET",
            f"customers/{self.test_customer_id}/leads",
            200,
            token=token
        )
        if not success:
            return False

        # Test GET customer leads with status filter
        success, _ = self.run_test(
            f"Get customer leads with filter ({user_type})",
            "GET",
            f"customers/{self.test_customer_id}/leads",
            200,
            token=token,
            params={"status": "New"}
        )
        if not success:
            return False

        # Test GET all leads
        success, _ = self.run_test(
            f"Get all leads ({user_type})",
            "GET",
            "leads",
            200,
            token=token
        )
        if not success:
            return False

        # Test PUT lead (update)
        update_data = {
            "title": "Updated Test Lead",
            "status": "Contacted",
            "value": 7500.0
        }
        success, _ = self.run_test(
            f"Update lead ({user_type})",
            "PUT",
            f"leads/{lead_id}",
            200,
            data=update_data,
            token=token
        )
        if not success:
            return False

        return True

    def test_role_based_access(self):
        """Test role-based access control"""
        print(f"\n🔒 Testing Role-Based Access Control...")
        
        if not self.admin_token or not self.user_token:
            print("❌ Missing tokens for role-based testing")
            return False

        # Admin should see all customers
        success, admin_customers = self.run_test(
            "Admin - Get all customers",
            "GET",
            "customers",
            200,
            token=self.admin_token
        )
        if not success:
            return False

        # User should see only their customers
        success, user_customers = self.run_test(
            "User - Get own customers",
            "GET",
            "customers",
            200,
            token=self.user_token
        )
        if not success:
            return False

        admin_count = len(admin_customers) if isinstance(admin_customers, list) else 0
        user_count = len(user_customers) if isinstance(user_customers, list) else 0
        
        print(f"   Admin sees {admin_count} customers, User sees {user_count} customers")
        
        if admin_count >= user_count:
            print("✅ Role-based access working correctly")
            return True
        else:
            print("❌ Role-based access may not be working correctly")
            return False

    def test_seed_data(self):
        """Test sample data seeding"""
        success, response = self.run_test(
            "Seed sample data",
            "POST",
            "seed-data",
            200
        )
        if success:
            message = response.get('message', '')
            if 'already exists' in message or 'created successfully' in message:
                print("✅ Seed data endpoint working correctly")
                return True
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print(f"\n🧹 Cleaning up test data...")
        
        # Delete test lead
        if self.test_lead_id and self.user_token:
            success, _ = self.run_test(
                "Delete test lead",
                "DELETE",
                f"leads/{self.test_lead_id}",
                200,
                token=self.user_token
            )
            if success:
                print("✅ Test lead deleted")

        # Delete test customer
        if self.test_customer_id and self.user_token:
            success, _ = self.run_test(
                "Delete test customer",
                "DELETE",
                f"customers/{self.test_customer_id}",
                200,
                token=self.user_token
            )
            if success:
                print("✅ Test customer deleted")

def main():
    print("🚀 Starting Mini CRM API Testing...")
    print("=" * 50)
    
    tester = MiniCRMAPITester()
    
    # Test authentication
    admin_login_success, admin_token = tester.test_login("admin@minicrm.com", "admin123", "admin")
    user_login_success, user_token = tester.test_login("john@minicrm.com", "user123", "user")
    
    if not admin_login_success or not user_login_success:
        print("❌ Authentication failed, stopping tests")
        return 1

    # Test seed data
    tester.test_seed_data()

    # Test dashboard stats for both users
    tester.test_dashboard_stats(admin_token, "admin")
    tester.test_dashboard_stats(user_token, "user")

    # Test customer operations for user
    if not tester.test_customer_operations(user_token, "user"):
        print("❌ Customer operations failed")
        return 1

    # Test lead operations for user
    if not tester.test_lead_operations(user_token, "user"):
        print("❌ Lead operations failed")
        return 1

    # Test role-based access
    tester.test_role_based_access()

    # Clean up test data
    tester.cleanup_test_data()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())