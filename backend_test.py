#!/usr/bin/env python3
"""
ROUND 7 Backend Test - Affiliate System + Admin CRUD + Auth + Banners
Tests all 21 items from ROUND 7 requirements:
- Affiliate registration, detail, activation, tracking
- Admin product CRUD with shared store propagation
- Admin banner management (max 5)
- Admin order management with 10% commission calculation
- Auth login/verify OTP
- Backward compatibility for products endpoint
"""

import requests
import json
import sys
import re

# Backend URL - use localhost since we're testing internally
BASE_URL = "http://localhost:3000"
ADMIN_KEY = "soraya-admin-2026"

# Global state to share between tests
test_state = {
    "affiliate_code": None,
    "new_product_id": None,
}

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"   {details}")
    print()

def test_01_affiliate_register_valid():
    """Test 1: POST /api/affiliate/register with valid payload"""
    print("=" * 80)
    print("TEST 1: POST /api/affiliate/register with valid payload")
    print("=" * 80)
    
    try:
        payload = {
            "fullName": "Siti Nurhaliza",
            "email": "siti.nurhaliza@example.com",
            "phone": "081234567890",
            "socialLinks": "instagram.com/sitinurhaliza",
            "payout": {
                "method": "bca",
                "accountName": "Siti Nurhaliza",
                "accountNumber": "1234567890"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/affiliate/register", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "affiliate" in data, "affiliate key missing"
        
        affiliate = data["affiliate"]
        assert "code" in affiliate, "affiliate.code missing"
        assert re.match(r"^AFI-[A-Z0-9]{5}$", affiliate["code"]), f"code pattern mismatch: {affiliate['code']}"
        assert affiliate.get("status") == "pending", f"status should be 'pending', got {affiliate.get('status')}"
        assert affiliate.get("commissionPct") == 10, f"commissionPct should be 10, got {affiliate.get('commissionPct')}"
        assert affiliate.get("fullName") == "Siti Nurhaliza", "fullName mismatch"
        assert affiliate.get("email") == "siti.nurhaliza@example.com", "email mismatch"
        
        # Save code for later tests
        test_state["affiliate_code"] = affiliate["code"]
        
        print_test("Affiliate register with valid payload", True, 
                   f"Code: {affiliate['code']}, status: pending, commissionPct: 10")
        return True
    except AssertionError as e:
        print_test("Affiliate register with valid payload", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate register with valid payload", False, f"Exception: {str(e)}")
        return False

def test_02_affiliate_register_duplicate():
    """Test 2: POST /api/affiliate/register with duplicate email"""
    print("=" * 80)
    print("TEST 2: POST /api/affiliate/register with duplicate email")
    print("=" * 80)
    
    try:
        payload = {
            "fullName": "Siti Nurhaliza Duplicate",
            "email": "siti.nurhaliza@example.com",  # Same email as test 1
            "phone": "081234567891"
        }
        resp = requests.post(f"{BASE_URL}/api/affiliate/register", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert "error" in data, "error key missing"
        assert "sudah terdaftar" in data["error"].lower(), f"Error message should mention 'sudah terdaftar', got: {data['error']}"
        
        print_test("Affiliate register with duplicate email returns 400", True, 
                   f"Error: {data['error']}")
        return True
    except AssertionError as e:
        print_test("Affiliate register with duplicate email returns 400", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate register with duplicate email returns 400", False, f"Exception: {str(e)}")
        return False

def test_03_affiliate_register_missing_field():
    """Test 3: POST /api/affiliate/register missing fullName"""
    print("=" * 80)
    print("TEST 3: POST /api/affiliate/register missing fullName")
    print("=" * 80)
    
    try:
        payload = {
            "email": "test@example.com",
            "phone": "081234567892"
        }
        resp = requests.post(f"{BASE_URL}/api/affiliate/register", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert "error" in data, "error key missing"
        
        print_test("Affiliate register missing fullName returns 400", True, 
                   f"Error: {data['error']}")
        return True
    except AssertionError as e:
        print_test("Affiliate register missing fullName returns 400", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate register missing fullName returns 400", False, f"Exception: {str(e)}")
        return False

def test_04_affiliate_detail():
    """Test 4: GET /api/affiliate/{code} returns full detail with stats"""
    print("=" * 80)
    print(f"TEST 4: GET /api/affiliate/{test_state['affiliate_code']}")
    print("=" * 80)
    
    try:
        code = test_state["affiliate_code"]
        assert code, "affiliate_code not set from test 1"
        
        resp = requests.get(f"{BASE_URL}/api/affiliate/{code}", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response keys: {list(data.keys())}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "affiliate" in data, "affiliate key missing"
        assert "stats" in data, "stats key missing"
        assert "orders" in data, "orders key missing"
        assert "trend" in data, "trend key missing"
        
        # Verify affiliate object
        affiliate = data["affiliate"]
        assert affiliate.get("code") == code, f"code mismatch: {affiliate.get('code')} != {code}"
        
        # Verify stats object
        stats = data["stats"]
        required_stats = ["clicks", "conversions", "approvedConversions", "totalCommission", "available", "trend"]
        for key in required_stats:
            assert key in stats, f"stats.{key} missing"
        
        # Verify trend array
        trend = data["trend"]
        assert isinstance(trend, list), "trend should be array"
        assert len(trend) == 30, f"trend should have 30 items, got {len(trend)}"
        
        # Verify orders array
        orders = data["orders"]
        assert isinstance(orders, list), "orders should be array"
        
        print_test("Affiliate detail returns full data", True, 
                   f"affiliate, stats (clicks:{stats['clicks']}, available:{stats['available']}), orders:{len(orders)}, trend:30")
        return True
    except AssertionError as e:
        print_test("Affiliate detail returns full data", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate detail returns full data", False, f"Exception: {str(e)}")
        return False

def test_05_affiliate_detail_nonexistent():
    """Test 5: GET /api/affiliate/NONEXISTENT returns 404"""
    print("=" * 80)
    print("TEST 5: GET /api/affiliate/NONEXISTENT")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/affiliate/NONEXISTENT", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        assert "error" in data, "error key missing"
        
        print_test("Affiliate detail nonexistent returns 404", True, 
                   f"Error: {data['error']}")
        return True
    except AssertionError as e:
        print_test("Affiliate detail nonexistent returns 404", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate detail nonexistent returns 404", False, f"Exception: {str(e)}")
        return False

def test_06_affiliate_activate_no_key():
    """Test 6: POST /api/affiliate/{code}/activate without x-admin-key returns 403"""
    print("=" * 80)
    print(f"TEST 6: POST /api/affiliate/{test_state['affiliate_code']}/activate without x-admin-key")
    print("=" * 80)
    
    try:
        code = test_state["affiliate_code"]
        assert code, "affiliate_code not set from test 1"
        
        resp = requests.post(f"{BASE_URL}/api/affiliate/{code}/activate", json={}, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        assert "error" in data, "error key missing"
        
        print_test("Affiliate activate without admin key returns 403", True, 
                   f"Error: {data['error']}")
        return True
    except AssertionError as e:
        print_test("Affiliate activate without admin key returns 403", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate activate without admin key returns 403", False, f"Exception: {str(e)}")
        return False

def test_07_affiliate_activate_with_key():
    """Test 7: POST /api/affiliate/{code}/activate with correct key returns 200"""
    print("=" * 80)
    print(f"TEST 7: POST /api/affiliate/{test_state['affiliate_code']}/activate with x-admin-key")
    print("=" * 80)
    
    try:
        code = test_state["affiliate_code"]
        assert code, "affiliate_code not set from test 1"
        
        headers = {"x-admin-key": ADMIN_KEY}
        resp = requests.post(f"{BASE_URL}/api/affiliate/{code}/activate", json={}, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "affiliate" in data, "affiliate key missing"
        assert data["affiliate"].get("status") == "active", f"status should be 'active', got {data['affiliate'].get('status')}"
        
        print_test("Affiliate activate with admin key returns 200", True, 
                   f"Status: active")
        return True
    except AssertionError as e:
        print_test("Affiliate activate with admin key returns 200", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate activate with admin key returns 200", False, f"Exception: {str(e)}")
        return False

def test_08_affiliate_track_click():
    """Test 8: POST /api/affiliate/track-click returns tracked:true"""
    print("=" * 80)
    print("TEST 8: POST /api/affiliate/track-click")
    print("=" * 80)
    
    try:
        code = test_state["affiliate_code"]
        assert code, "affiliate_code not set from test 1"
        
        payload = {
            "code": code,
            "productId": "1"
        }
        resp = requests.post(f"{BASE_URL}/api/affiliate/track-click", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert data.get("tracked") == True, f"tracked should be true, got {data.get('tracked')}"
        
        print_test("Affiliate track click returns tracked:true", True, 
                   f"Click tracked for code: {code}, productId: 1")
        return True
    except AssertionError as e:
        print_test("Affiliate track click returns tracked:true", False, str(e))
        return False
    except Exception as e:
        print_test("Affiliate track click returns tracked:true", False, f"Exception: {str(e)}")
        return False

def test_09_payout_insufficient_balance():
    """Test 9: POST /api/payouts with insufficient balance returns 400"""
    print("=" * 80)
    print("TEST 9: POST /api/payouts with insufficient balance")
    print("=" * 80)
    
    try:
        code = test_state["affiliate_code"]
        assert code, "affiliate_code not set from test 1"
        
        payload = {
            "code": code,
            "amount": 50000
        }
        resp = requests.post(f"{BASE_URL}/api/payouts", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert "error" in data, "error key missing"
        assert "saldo tidak cukup" in data["error"].lower(), f"Error should mention 'saldo tidak cukup', got: {data['error']}"
        
        print_test("Payout with insufficient balance returns 400", True, 
                   f"Error: {data['error']}")
        return True
    except AssertionError as e:
        print_test("Payout with insufficient balance returns 400", False, str(e))
        return False
    except Exception as e:
        print_test("Payout with insufficient balance returns 400", False, f"Exception: {str(e)}")
        return False

def test_10_admin_products_list():
    """Test 10: GET /api/admin/products with key returns catalog"""
    print("=" * 80)
    print("TEST 10: GET /api/admin/products with x-admin-key")
    print("=" * 80)
    
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        resp = requests.get(f"{BASE_URL}/api/admin/products", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response items count: {len(data.get('items', []))}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "items" in data, "items key missing"
        assert len(data["items"]) == 8, f"Expected 8 products, got {len(data['items'])}"
        
        # Verify each product has commissionPct
        for product in data["items"]:
            assert "commissionPct" in product, f"Product {product.get('id')} missing commissionPct"
            assert isinstance(product["commissionPct"], (int, float)), f"commissionPct should be number, got {type(product['commissionPct'])}"
        
        print_test("Admin products list returns catalog", True, 
                   f"Found {len(data['items'])} products, all have commissionPct")
        return True
    except AssertionError as e:
        print_test("Admin products list returns catalog", False, str(e))
        return False
    except Exception as e:
        print_test("Admin products list returns catalog", False, f"Exception: {str(e)}")
        return False

def test_11_admin_products_create():
    """Test 11: POST /api/admin/products creates new product"""
    print("=" * 80)
    print("TEST 11: POST /api/admin/products with new product")
    print("=" * 80)
    
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        payload = {
            "name": "Test Product Baru",
            "price": 150000,
            "category": "Blouse"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/products", json=payload, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "product" in data, "product key missing"
        
        product = data["product"]
        assert "id" in product, "product.id missing"
        assert product.get("name") == "Test Product Baru", f"name mismatch: {product.get('name')}"
        assert product.get("price") == 150000, f"price mismatch: {product.get('price')}"
        
        # Save product ID for later tests
        test_state["new_product_id"] = product["id"]
        
        print_test("Admin products create returns new product", True, 
                   f"Created product ID: {product['id']}, name: {product['name']}")
        return True
    except AssertionError as e:
        print_test("Admin products create returns new product", False, str(e))
        return False
    except Exception as e:
        print_test("Admin products create returns new product", False, f"Exception: {str(e)}")
        return False

def test_12_admin_products_update_propagates():
    """Test 12: POST /api/admin/products/{id} updates price, verify GET /api/products/{id} returns updated price"""
    print("=" * 80)
    print("TEST 12: POST /api/admin/products/{id} with price update + verify propagation")
    print("=" * 80)
    
    try:
        product_id = test_state["new_product_id"]
        assert product_id, "new_product_id not set from test 11"
        
        # Update price
        headers = {"x-admin-key": ADMIN_KEY}
        payload = {"price": 999999}
        resp = requests.post(f"{BASE_URL}/api/admin/products/{product_id}", json=payload, headers=headers, timeout=10)
        print(f"Admin update status: {resp.status_code}")
        data = resp.json()
        print(f"Admin update response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        
        # Verify public endpoint returns updated price
        print(f"\nVerifying GET /api/products/{product_id}...")
        resp2 = requests.get(f"{BASE_URL}/api/products/{product_id}", timeout=10)
        print(f"Public get status: {resp2.status_code}")
        data2 = resp2.json()
        print(f"Public get response price: {data2.get('price')}")
        
        assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"
        assert data2.get("price") == 999999, f"Price should be 999999, got {data2.get('price')}"
        
        print_test("Admin product update propagates to public endpoint", True, 
                   f"Updated price to 999999, verified in GET /api/products/{product_id}")
        return True
    except AssertionError as e:
        print_test("Admin product update propagates to public endpoint", False, str(e))
        return False
    except Exception as e:
        print_test("Admin product update propagates to public endpoint", False, f"Exception: {str(e)}")
        return False

def test_13_admin_products_delete():
    """Test 13: DELETE /api/admin/products/{id} removes product"""
    print("=" * 80)
    print("TEST 13: DELETE /api/admin/products/{id}")
    print("=" * 80)
    
    try:
        product_id = test_state["new_product_id"]
        assert product_id, "new_product_id not set from test 11"
        
        headers = {"x-admin-key": ADMIN_KEY}
        resp = requests.delete(f"{BASE_URL}/api/admin/products/{product_id}", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        
        print_test("Admin product delete returns 200", True, 
                   f"Deleted product ID: {product_id}")
        return True
    except AssertionError as e:
        print_test("Admin product delete returns 200", False, str(e))
        return False
    except Exception as e:
        print_test("Admin product delete returns 200", False, f"Exception: {str(e)}")
        return False

def test_14_admin_banners_list():
    """Test 14: GET /api/admin/banners with key returns 5 banners"""
    print("=" * 80)
    print("TEST 14: GET /api/admin/banners with x-admin-key")
    print("=" * 80)
    
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        resp = requests.get(f"{BASE_URL}/api/admin/banners", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response items count: {len(data.get('items', []))}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "items" in data, "items key missing"
        assert len(data["items"]) == 5, f"Expected 5 banners, got {len(data['items'])}"
        
        print_test("Admin banners list returns 5 banners", True, 
                   f"Found {len(data['items'])} banners")
        return True
    except AssertionError as e:
        print_test("Admin banners list returns 5 banners", False, str(e))
        return False
    except Exception as e:
        print_test("Admin banners list returns 5 banners", False, f"Exception: {str(e)}")
        return False

def test_15_admin_banners_update():
    """Test 15: PUT /api/admin/banners updates all banners, verify GET /api/banners returns only active"""
    print("=" * 80)
    print("TEST 15: PUT /api/admin/banners + verify public endpoint")
    print("=" * 80)
    
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        payload = {
            "items": [
                {
                    "title": "Test Banner 1",
                    "image": "https://example.com/banner1.jpg",
                    "cta": "Shop Now",
                    "href": "/",
                    "active": True
                },
                {
                    "title": "Test Banner 2",
                    "image": "https://example.com/banner2.jpg",
                    "cta": "View",
                    "href": "/",
                    "active": False  # Inactive
                }
            ]
        }
        resp = requests.put(f"{BASE_URL}/api/admin/banners", json=payload, headers=headers, timeout=10)
        print(f"Admin update status: {resp.status_code}")
        data = resp.json()
        print(f"Admin update response items count: {len(data.get('items', []))}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert len(data["items"]) == 2, f"Expected 2 banners, got {len(data['items'])}"
        
        # Verify public endpoint returns only active banners
        print(f"\nVerifying GET /api/banners (public)...")
        resp2 = requests.get(f"{BASE_URL}/api/banners", timeout=10)
        print(f"Public get status: {resp2.status_code}")
        data2 = resp2.json()
        print(f"Public get response items count: {len(data2.get('items', []))}")
        
        assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"
        assert "items" in data2, "items key missing"
        assert len(data2["items"]) == 1, f"Expected 1 active banner, got {len(data2['items'])}"
        assert data2["items"][0].get("title") == "Test Banner 1", f"Title mismatch: {data2['items'][0].get('title')}"
        
        print_test("Admin banners update + public endpoint filters active", True, 
                   f"Updated 2 banners, public endpoint returns 1 active banner")
        return True
    except AssertionError as e:
        print_test("Admin banners update + public endpoint filters active", False, str(e))
        return False
    except Exception as e:
        print_test("Admin banners update + public endpoint filters active", False, f"Exception: {str(e)}")
        return False

def test_16_banners_public():
    """Test 16: GET /api/banners (public, no key) returns only active banners"""
    print("=" * 80)
    print("TEST 16: GET /api/banners (public, no key)")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/banners", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "items" in data, "items key missing"
        
        # Verify all items are active
        for item in data["items"]:
            assert item.get("active") != False, f"Found inactive banner in public endpoint: {item}"
        
        print_test("Public banners endpoint returns only active", True, 
                   f"Found {len(data['items'])} active banners")
        return True
    except AssertionError as e:
        print_test("Public banners endpoint returns only active", False, str(e))
        return False
    except Exception as e:
        print_test("Public banners endpoint returns only active", False, f"Exception: {str(e)}")
        return False

def test_17_auth_login():
    """Test 17: POST /api/auth/login returns otpId and devOtp"""
    print("=" * 80)
    print("TEST 17: POST /api/auth/login")
    print("=" * 80)
    
    try:
        payload = {"phone": "08123456789"}
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "otpId" in data, "otpId key missing"
        assert "devOtp" in data, "devOtp key missing"
        assert data.get("devOtp") == "123456", f"devOtp should be '123456', got {data.get('devOtp')}"
        
        print_test("Auth login returns otpId and devOtp", True, 
                   f"otpId: {data['otpId']}, devOtp: 123456")
        return True
    except AssertionError as e:
        print_test("Auth login returns otpId and devOtp", False, str(e))
        return False
    except Exception as e:
        print_test("Auth login returns otpId and devOtp", False, f"Exception: {str(e)}")
        return False

def test_18_auth_verify_otp_valid():
    """Test 18: POST /api/auth/verify-otp with correct OTP returns user and token"""
    print("=" * 80)
    print("TEST 18: POST /api/auth/verify-otp with otp=123456")
    print("=" * 80)
    
    try:
        payload = {
            "otp": "123456",
            "otpId": "OTP-test",
            "phone": "08123456789"
        }
        resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "user" in data, "user key missing"
        assert "token" in data, "token key missing"
        
        user = data["user"]
        assert "id" in user, "user.id missing"
        assert "name" in user, "user.name missing"
        
        print_test("Auth verify OTP with correct code returns user and token", True, 
                   f"user.id: {user['id']}, token present")
        return True
    except AssertionError as e:
        print_test("Auth verify OTP with correct code returns user and token", False, str(e))
        return False
    except Exception as e:
        print_test("Auth verify OTP with correct code returns user and token", False, f"Exception: {str(e)}")
        return False

def test_19_auth_verify_otp_invalid():
    """Test 19: POST /api/auth/verify-otp with wrong OTP returns 400"""
    print("=" * 80)
    print("TEST 19: POST /api/auth/verify-otp with otp=999999")
    print("=" * 80)
    
    try:
        payload = {
            "otp": "999999",
            "otpId": "OTP-test"
        }
        resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert "error" in data, "error key missing"
        
        print_test("Auth verify OTP with wrong code returns 400", True, 
                   f"Error: {data['error']}")
        return True
    except AssertionError as e:
        print_test("Auth verify OTP with wrong code returns 400", False, str(e))
        return False
    except Exception as e:
        print_test("Auth verify OTP with wrong code returns 400", False, f"Exception: {str(e)}")
        return False

def test_20_regression_checkout_payment():
    """Test 20: REGRESSION - Full E2E checkout session → payment snap → Komerce KPAY-xxx"""
    print("=" * 80)
    print("TEST 20: REGRESSION - Full E2E checkout → payment")
    print("=" * 80)
    
    try:
        # Step 1: Create checkout session
        print("\nStep 1: Create checkout session...")
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Tunik Rayon",
                    "price": 129000,
                    "image": "https://example.com/tunik.jpg"
                }
            ],
            "customer": {
                "name": "Fatimah Zahra",
                "phone": "081234567890",
                "email": "fatimah@example.com",
                "address": "Jl Sudirman 123",
                "destination": {
                    "id": "LOCAL-JKT-01",
                    "text": "Jakarta Pusat"
                }
            },
            "shipping": {
                "service": "jne",
                "service_name": "JNE REG",
                "price": 15000,
                "estimated_days": "2-3"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Checkout status: {resp.status_code}")
        data = resp.json()
        
        assert resp.status_code == 200, f"Checkout failed: {resp.status_code}"
        assert data.get("success") == True, "Checkout success should be true"
        assert "order" in data, "order key missing"
        order = data["order"]
        print(f"✓ Order created: {order['id']} - Rp {order['grandTotal']}")
        
        # Step 2: Create payment
        print("\nStep 2: Create QRIS payment...")
        payload = {"orderId": order["id"]}
        resp = requests.post(f"{BASE_URL}/api/payment/snap", json=payload, timeout=10)
        print(f"Payment status: {resp.status_code}")
        data = resp.json()
        
        assert resp.status_code == 200, f"Payment failed: {resp.status_code}"
        assert data.get("success") == True, "Payment success should be true"
        assert "paymentId" in data, "paymentId key missing"
        assert "redirect_url" in data, "redirect_url key missing"
        assert data["paymentId"].startswith("KPAY-"), f"Invalid paymentId: {data['paymentId']}"
        assert "pay-sandbox.komerce.my.id" in data["redirect_url"] or "pay.komerce.my.id" in data["redirect_url"], \
            f"Invalid redirect_url: {data['redirect_url']}"
        
        print(f"✓ Payment created: {data['paymentId']}")
        print(f"✓ Payment URL: {data['redirect_url']}")
        
        print_test("REGRESSION - Full E2E checkout → payment works", True, 
                   f"Order {order['id']} → Payment {data['paymentId']}")
        return True
    except AssertionError as e:
        print_test("REGRESSION - Full E2E checkout → payment works", False, str(e))
        return False
    except Exception as e:
        print_test("REGRESSION - Full E2E checkout → payment works", False, f"Exception: {str(e)}")
        return False

def test_21_products_backward_compat():
    """Test 21: GET /api/products returns BOTH .items and .products for backward compatibility"""
    print("=" * 80)
    print("TEST 21: GET /api/products backward compatibility")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response keys: {list(data.keys())}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "items" in data, "items key missing"
        assert "products" in data, "products key missing"
        assert isinstance(data["items"], list), "items should be array"
        assert isinstance(data["products"], list), "products should be array"
        assert len(data["items"]) == len(data["products"]), \
            f"items and products length mismatch: {len(data['items'])} != {len(data['products'])}"
        
        print_test("Products endpoint has backward compatibility", True, 
                   f"Both .items and .products present with {len(data['items'])} products")
        return True
    except AssertionError as e:
        print_test("Products endpoint has backward compatibility", False, str(e))
        return False
    except Exception as e:
        print_test("Products endpoint has backward compatibility", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "=" * 80)
    print("ROUND 7 BACKEND TEST - AFFILIATE + ADMIN + AUTH + BANNERS")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Admin Key: {ADMIN_KEY}")
    print("=" * 80 + "\n")
    
    results = []
    
    # Run all 21 tests in order
    results.append(("01. Affiliate register valid", test_01_affiliate_register_valid()))
    results.append(("02. Affiliate register duplicate", test_02_affiliate_register_duplicate()))
    results.append(("03. Affiliate register missing field", test_03_affiliate_register_missing_field()))
    results.append(("04. Affiliate detail", test_04_affiliate_detail()))
    results.append(("05. Affiliate detail nonexistent", test_05_affiliate_detail_nonexistent()))
    results.append(("06. Affiliate activate no key", test_06_affiliate_activate_no_key()))
    results.append(("07. Affiliate activate with key", test_07_affiliate_activate_with_key()))
    results.append(("08. Affiliate track click", test_08_affiliate_track_click()))
    results.append(("09. Payout insufficient balance", test_09_payout_insufficient_balance()))
    results.append(("10. Admin products list", test_10_admin_products_list()))
    results.append(("11. Admin products create", test_11_admin_products_create()))
    results.append(("12. Admin products update propagates", test_12_admin_products_update_propagates()))
    results.append(("13. Admin products delete", test_13_admin_products_delete()))
    results.append(("14. Admin banners list", test_14_admin_banners_list()))
    results.append(("15. Admin banners update", test_15_admin_banners_update()))
    results.append(("16. Banners public", test_16_banners_public()))
    results.append(("17. Auth login", test_17_auth_login()))
    results.append(("18. Auth verify OTP valid", test_18_auth_verify_otp_valid()))
    results.append(("19. Auth verify OTP invalid", test_19_auth_verify_otp_invalid()))
    results.append(("20. REGRESSION checkout payment", test_20_regression_checkout_payment()))
    results.append(("21. Products backward compat", test_21_products_backward_compat()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("=" * 80)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("=" * 80 + "\n")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Affiliate system + Admin CRUD + Auth + Banners working perfectly.")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the failures above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
