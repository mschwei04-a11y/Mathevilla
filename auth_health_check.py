#!/usr/bin/env python3
"""
Authentication Health Check for MatheVilla
Tests the specific authentication flows requested in the review.
"""

import requests
import json
import sys
from datetime import datetime

class AuthHealthChecker:
    def __init__(self, base_url="https://matheschule.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.student_token = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")
        print()

    def test_admin_login(self):
        """Test admin login with specified credentials"""
        print("🔐 Testing Admin Login...")
        
        url = f"{self.base_url}/auth/login"
        data = {
            "email": "admin@mathevilla.de",
            "password": "admin123"
        }
        
        try:
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                result = response.json()
                
                # Check for access_token
                if 'access_token' not in result:
                    self.log_test("Admin Login", False, "No access_token in response")
                    return False
                
                # Check user role
                if 'user' not in result or result['user'].get('role') != 'admin':
                    self.log_test("Admin Login", False, f"User role is {result.get('user', {}).get('role')}, expected 'admin'")
                    return False
                
                self.admin_token = result['access_token']
                user_info = result['user']
                
                self.log_test("Admin Login", True, 
                    f"Token received, Role: {user_info['role']}, Email: {user_info['email']}")
                return True
            else:
                self.log_test("Admin Login", False, 
                    f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_student_login(self):
        """Test student login with specified credentials"""
        print("👨‍🎓 Testing Student Login...")
        
        url = f"{self.base_url}/auth/login"
        data = {
            "email": "max2@test.de",
            "password": "test123"
        }
        
        try:
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                result = response.json()
                
                # Check for access_token
                if 'access_token' not in result:
                    self.log_test("Student Login", False, "No access_token in response")
                    return False
                
                # Check user role
                if 'user' not in result or result['user'].get('role') != 'student':
                    self.log_test("Student Login", False, f"User role is {result.get('user', {}).get('role')}, expected 'student'")
                    return False
                
                self.student_token = result['access_token']
                user_info = result['user']
                
                self.log_test("Student Login", True, 
                    f"Token received, Role: {user_info['role']}, Email: {user_info['email']}")
                return True
            else:
                self.log_test("Student Login", False, 
                    f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Student Login", False, f"Exception: {str(e)}")
            return False

    def test_protected_route_without_token(self):
        """Test protected route without authentication token"""
        print("🔒 Testing Protected Route Without Token...")
        
        url = f"{self.base_url}/auth/me"
        
        try:
            response = requests.get(url, headers={'Content-Type': 'application/json'})
            
            # Should fail with 401 or 403
            if response.status_code in [401, 403]:
                self.log_test("Protected Route Without Token", True, 
                    f"Correctly rejected with HTTP {response.status_code}")
                return True
            else:
                self.log_test("Protected Route Without Token", False, 
                    f"Expected 401/403, got HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Protected Route Without Token", False, f"Exception: {str(e)}")
            return False

    def test_protected_route_with_valid_token(self):
        """Test protected route with valid authentication token"""
        print("🔓 Testing Protected Route With Valid Token...")
        
        if not self.admin_token:
            self.log_test("Protected Route With Valid Token", False, "No admin token available")
            return False
        
        url = f"{self.base_url}/auth/me"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if user data is returned
                if 'email' in result and 'role' in result:
                    self.log_test("Protected Route With Valid Token", True, 
                        f"User data returned: {result['email']}, Role: {result['role']}")
                    return True
                else:
                    self.log_test("Protected Route With Valid Token", False, 
                        "Response missing expected user fields")
                    return False
            else:
                self.log_test("Protected Route With Valid Token", False, 
                    f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Protected Route With Valid Token", False, f"Exception: {str(e)}")
            return False

    def test_new_registration(self):
        """Test new user registration"""
        print("📝 Testing New Registration...")
        
        # Create unique email with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        url = f"{self.base_url}/auth/register"
        data = {
            "email": f"healthcheck_{timestamp}@test.de",
            "password": "test123",
            "name": "Health Check User",
            "role": "student",
            "grade": 7
        }
        
        try:
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                result = response.json()
                
                # Check for access_token
                if 'access_token' not in result:
                    self.log_test("New Registration", False, "No access_token in response")
                    return False
                
                # Check user data
                if 'user' not in result:
                    self.log_test("New Registration", False, "No user data in response")
                    return False
                
                user_info = result['user']
                self.log_test("New Registration", True, 
                    f"Registration successful: {user_info['email']}, Role: {user_info['role']}")
                return True
            else:
                self.log_test("New Registration", False, 
                    f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("New Registration", False, f"Exception: {str(e)}")
            return False

    def run_health_check(self):
        """Run all authentication health checks"""
        print("🏥 AUTHENTICATION HEALTH CHECK")
        print("=" * 50)
        print(f"Backend URL: {self.base_url}")
        print()
        
        # Run tests in order
        tests = [
            ("Admin Login Test", self.test_admin_login),
            ("Student Login Test", self.test_student_login),
            ("Protected Route Without Token", self.test_protected_route_without_token),
            ("Protected Route With Valid Token", self.test_protected_route_with_valid_token),
            ("New Registration Test", self.test_new_registration),
        ]
        
        failed_tests = []
        
        for test_name, test_func in tests:
            try:
                if not test_func():
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                failed_tests.append(test_name)
        
        # Print summary
        print("=" * 50)
        print(f"📊 HEALTH CHECK RESULTS: {self.tests_passed}/{self.tests_run} passed")
        
        if failed_tests:
            print(f"❌ FAILED TESTS: {', '.join(failed_tests)}")
            print("🚨 AUTHENTICATION SYSTEM HAS ISSUES")
            return False
        else:
            print("✅ ALL AUTHENTICATION TESTS PASSED")
            print("💚 AUTHENTICATION SYSTEM IS HEALTHY")
            return True

def main():
    checker = AuthHealthChecker()
    success = checker.run_health_check()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())