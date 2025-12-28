import requests
import sys
from datetime import datetime
import json

class MatheVillaAPITester:
    def __init__(self, base_url="https://matheschule.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.student_id = None
        self.admin_id = None
        self.reset_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_seed_database(self):
        """Test seeding the database"""
        success, response = self.run_test(
            "Seed Database",
            "POST",
            "seed",
            200
        )
        return success

    def test_student_registration(self):
        """Test student registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        student_data = {
            "email": f"testschueler{timestamp}@test.de",
            "password": "test123",
            "name": "Test Schüler",
            "role": "student",
            "grade": 6
        }
        
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data=student_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.student_id = response['user']['id']
            print(f"   Student ID: {self.student_id}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        admin_credentials = {
            "email": "admin@mathevilla.de",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_credentials
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_id = response['user']['id']
            print(f"   Admin ID: {self.admin_id}")
            return True
        return False

    def test_get_grades(self):
        """Test getting available grades"""
        success, response = self.run_test(
            "Get Grades",
            "GET",
            "tasks/grades",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_get_topics(self):
        """Test getting topics for grade 6"""
        success, response = self.run_test(
            "Get Topics for Grade 6",
            "GET",
            "tasks/topics/6",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_get_tasks(self):
        """Test getting tasks for a specific topic"""
        success, response = self.run_test(
            "Get Tasks for Bruchrechnung",
            "GET",
            "tasks/6/Bruchrechnung",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and response:
            # Store first task ID for submission test
            self.task_id = response[0]['id'] if response else None
            print(f"   Found {len(response)} tasks")
            if self.task_id:
                print(f"   First task ID: {self.task_id}")
        
        return success

    def test_submit_answer(self):
        """Test submitting an answer"""
        if not hasattr(self, 'task_id') or not self.task_id:
            print("❌ No task ID available for submission test")
            return False
            
        submission_data = {
            "task_id": self.task_id,
            "answer": "5/6"  # Correct answer for the first Bruchrechnung task
        }
        
        success, response = self.run_test(
            "Submit Answer",
            "POST",
            "tasks/submit",
            200,
            data=submission_data,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_get_progress(self):
        """Test getting user progress"""
        success, response = self.run_test(
            "Get Progress Overview",
            "GET",
            "progress/overview",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_get_user_stats(self):
        """Test getting user statistics"""
        success, response = self.run_test(
            "Get User Stats",
            "GET",
            "progress/stats",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_daily_challenge(self):
        """Test getting daily challenge"""
        success, response = self.run_test(
            "Get Daily Challenge",
            "GET",
            "challenges/daily",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_admin_stats(self):
        """Test admin statistics"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_admin_students(self):
        """Test getting all students (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Get All Students",
            "GET",
            "admin/students",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_admin_tasks(self):
        """Test getting all tasks (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Get All Tasks",
            "GET",
            "admin/tasks",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"   Found {len(response)} total tasks")
            # Count tasks per grade
            grade_counts = {}
            for task in response:
                grade = task.get('grade')
                grade_counts[grade] = grade_counts.get(grade, 0) + 1
            
            print(f"   Tasks per grade: {grade_counts}")
            
            # Check if we have 20-25 tasks per grade as required
            for grade in range(5, 11):
                count = grade_counts.get(grade, 0)
                if count < 20:
                    print(f"   ⚠️  Grade {grade} has only {count} tasks (expected 20-25)")
                else:
                    print(f"   ✅ Grade {grade} has {count} tasks")
        
        return success

    def test_password_reset_request(self):
        """Test password reset request - HIGH PRIORITY"""
        reset_data = {
            "email": "admin@mathevilla.de"
        }
        
        success, response = self.run_test(
            "Password Reset Request",
            "POST",
            "auth/password-reset-request",
            200,
            data=reset_data
        )
        
        if success and 'reset_token' in response:
            self.reset_token = response['reset_token']
            print(f"   Reset token received: {self.reset_token[:20]}...")
            return True
        elif success:
            print("   ⚠️  Reset request successful but no token in response (production mode)")
            return True
        return False

    def test_password_reset_confirm(self):
        """Test password reset confirmation - HIGH PRIORITY"""
        if not self.reset_token:
            print("❌ No reset token available - skipping confirmation test")
            return False
            
        confirm_data = {
            "token": self.reset_token,
            "new_password": "newadmin123"
        }
        
        success, response = self.run_test(
            "Password Reset Confirm",
            "POST",
            "auth/password-reset-confirm",
            200,
            data=confirm_data
        )
        return success

    def test_login_with_new_password(self):
        """Test login with new password after reset"""
        if not self.reset_token:
            print("❌ No password reset performed - skipping new password test")
            return False
            
        new_credentials = {
            "email": "admin@mathevilla.de",
            "password": "newadmin123"
        }
        
        success, response = self.run_test(
            "Login with New Password",
            "POST",
            "auth/login",
            200,
            data=new_credentials
        )
        
        if success and 'access_token' in response:
            print("   ✅ Login successful with new password")
            # Reset password back to original for other tests
            self.admin_token = response['access_token']
            return True
        return False

    def test_reset_password_back(self):
        """Reset password back to original for other tests"""
        if not self.admin_token:
            return False
            
        # Request another reset
        reset_data = {"email": "admin@mathevilla.de"}
        success, response = self.run_test(
            "Reset Password Back - Request",
            "POST",
            "auth/password-reset-request",
            200,
            data=reset_data
        )
        
        if success and 'reset_token' in response:
            # Confirm with original password
            confirm_data = {
                "token": response['reset_token'],
                "new_password": "admin123"
            }
            
            success2, response2 = self.run_test(
                "Reset Password Back - Confirm",
                "POST",
                "auth/password-reset-confirm",
                200,
                data=confirm_data
            )
            return success2
        return False

    def test_specific_grade_topic_tasks(self):
        """Test GET /api/tasks/5/Grundrechenarten as requested"""
        success, response = self.run_test(
            "Get Grade 5 Grundrechenarten Tasks",
            "GET",
            "tasks/5/Grundrechenarten",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and response:
            print(f"   Found {len(response)} Grundrechenarten tasks for Grade 5")
            if len(response) >= 20:
                print("   ✅ Sufficient tasks available")
            else:
                print(f"   ⚠️  Only {len(response)} tasks (expected ~20-25)")
        
        return success

    def test_ai_recommendations(self):
        """Test AI recommendations endpoint"""
        success, response = self.run_test(
            "Get AI Recommendations",
            "GET",
            "recommendations/ai",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_regular_recommendations(self):
        """Test regular recommendations endpoint"""
        success, response = self.run_test(
            "Get Regular Recommendations",
            "GET",
            "recommendations",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_protected_routes_without_auth(self):
        """Test that protected routes require authentication"""
        print("\n🔒 Testing protected routes without authentication...")
        
        protected_endpoints = [
            ("tasks/5/Grundrechenarten", "GET"),
            ("progress/overview", "GET"),
            ("challenges/daily", "GET"),
            ("admin/stats", "GET"),
            ("admin/students", "GET")
        ]
        
        all_protected = True
        for endpoint, method in protected_endpoints:
            success, response = self.run_test(
                f"Protected Route: {endpoint}",
                method,
                endpoint,
                403  # Expecting forbidden (correct for missing auth)
            )
            if not success:
                all_protected = False
                
        return all_protected

def main():
    print("🚀 Starting MatheVilla API Tests...")
    print("=" * 50)
    
    tester = MatheVillaAPITester()
    
    # Test sequence - HIGH PRIORITY TESTS FIRST
    tests = [
        ("API Health", tester.test_api_health),
        ("Seed Database", tester.test_seed_database),
        
        # HIGH PRIORITY: Password Reset Flow
        ("Password Reset Request", tester.test_password_reset_request),
        ("Password Reset Confirm", tester.test_password_reset_confirm),
        ("Login with New Password", tester.test_login_with_new_password),
        ("Reset Password Back", tester.test_reset_password_back),
        
        # Authentication Tests
        ("Admin Login", tester.test_admin_login),
        ("Student Registration", tester.test_student_registration),
        
        # Protected Routes Test
        ("Protected Routes Without Auth", tester.test_protected_routes_without_auth),
        
        # Task System Tests
        ("Admin Tasks (~20-25 per grade)", tester.test_admin_tasks),
        ("Grade 5 Grundrechenarten Tasks", tester.test_specific_grade_topic_tasks),
        ("Get Grades", tester.test_get_grades),
        ("Get Topics", tester.test_get_topics),
        ("Get Tasks", tester.test_get_tasks),
        
        # Admin Dashboard Tests
        ("Admin Stats", tester.test_admin_stats),
        ("Admin Students", tester.test_admin_students),
        
        # Student Features Tests
        ("Submit Answer", tester.test_submit_answer),
        ("Get Progress Overview", tester.test_get_progress),
        ("Get User Stats", tester.test_get_user_stats),
        ("Daily Challenge", tester.test_daily_challenge),
        
        # AI and Recommendations
        ("AI Recommendations", tester.test_ai_recommendations),
        ("Regular Recommendations", tester.test_regular_recommendations),
    ]
    
    failed_tests = []
    critical_failures = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
                # Mark critical failures
                if any(keyword in test_name.lower() for keyword in ['password reset', 'admin login', 'protected routes']):
                    critical_failures.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed_tests.append(test_name)
            if any(keyword in test_name.lower() for keyword in ['password reset', 'admin login', 'protected routes']):
                critical_failures.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if critical_failures:
        print(f"🚨 CRITICAL FAILURES: {', '.join(critical_failures)}")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())