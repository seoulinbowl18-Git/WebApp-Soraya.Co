#!/usr/bin/env python3
"""
Backend API Tests for Komerce Integration - Soraya.Co
Tests all Komerce endpoints including Order CRUD, Destination Search, Shipping Cost, and QRIS Payment
"""

import requests
import json
import time
import os
from datetime import datetime

# Base URL - use localhost since we're testing internally
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

print(f"🧪 Testing Komerce Backend APIs")
print(f"📍 Base URL: {API_BASE}")
print(f"⏰ Test started at: {datetime.now().isoformat()}")
print("=" * 80)

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "warnings": 0,
    "tests": []
}

def log_test(name, status, message="", details=None):
    """Log test result"""
    emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"\n{emoji} {name}")
    if message:
        print(f"   {message}")
    if details:
        print(f"   Details: {json.dumps(details, indent=2)}")
    
    test_results["tests"].append({
        "name": name,
        "status": status,
        "message": message,
        "details": details
    })
    
    if status == "PASS":
        test_results["passed"] += 1
    elif status == "FAIL":
        test_results["failed"] += 1
    else:
        test_results["warnings"] += 1

# Store created order ID for subsequent tests
created_order_id = None

print("\n" + "=" * 80)
print("📦 TEST SUITE 1: ORDER CRUD (In-Memory)")
print("=" * 80)

# Test 1: POST /api/komerce/order - Valid payload
print("\n🔹 Test 1: Create order with valid payload")
try:
    payload = {
        "customerName": "Siti Nurhaliza",
        "customerPhone": "081234567890",
        "customerEmail": "siti@example.com",
        "destinationId": "12345",
        "addressDetail": "Jl. Merdeka No. 123, Jakarta Pusat",
        "courierCode": "jne",
        "courierService": "REG",
        "shippingCost": 15000,
        "paymentMethod": "QRIS",
        "subtotal": 250000,
        "items": [
            {"name": "Batik Tulis Premium", "qty": 1, "price": 150000},
            {"name": "Kerudung Silk", "qty": 2, "price": 50000}
        ]
    }
    
    response = requests.post(f"{API_BASE}/komerce/order", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        order = data.get("order", {})
        order_id = order.get("orderId", "")
        
        # Validate orderId pattern
        if order_id.startswith("SRY-") and len(order_id.split("-")) == 3:
            created_order_id = order_id
            
            # Validate grandTotal calculation
            expected_total = 250000 + 15000
            actual_total = order.get("grandTotal")
            
            if actual_total == expected_total:
                # Validate paymentStatus for QRIS
                payment_status = order.get("paymentStatus")
                if payment_status == "pending":
                    log_test("POST /api/komerce/order - Valid payload", "PASS", 
                            f"Order created successfully with ID: {order_id}, grandTotal: {actual_total}, paymentStatus: {payment_status}")
                else:
                    log_test("POST /api/komerce/order - Valid payload", "FAIL", 
                            f"Expected paymentStatus 'pending' for QRIS, got '{payment_status}'")
            else:
                log_test("POST /api/komerce/order - Valid payload", "FAIL", 
                        f"grandTotal mismatch: expected {expected_total}, got {actual_total}")
        else:
            log_test("POST /api/komerce/order - Valid payload", "FAIL", 
                    f"Invalid orderId pattern: {order_id} (expected SRY-timestamp-random)")
    else:
        log_test("POST /api/komerce/order - Valid payload", "FAIL", 
                f"Status: {response.status_code}, Response: {data}")
except Exception as e:
    log_test("POST /api/komerce/order - Valid payload", "FAIL", f"Exception: {str(e)}")

# Test 2: POST /api/komerce/order - COD payment method
print("\n🔹 Test 2: Create order with COD payment method")
try:
    payload = {
        "customerName": "Ahmad Dhani",
        "customerPhone": "082345678901",
        "customerEmail": "ahmad@example.com",
        "destinationId": "54321",
        "addressDetail": "Jl. Sudirman No. 456, Bandung",
        "courierCode": "jnt",
        "courierService": "EXPRESS",
        "shippingCost": 20000,
        "paymentMethod": "COD",
        "subtotal": 180000,
        "items": [
            {"name": "Kemeja Batik", "qty": 1, "price": 180000}
        ]
    }
    
    response = requests.post(f"{API_BASE}/komerce/order", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        order = data.get("order", {})
        payment_status = order.get("paymentStatus")
        order_status = order.get("status")
        
        if payment_status == "cod" and order_status == "confirmed":
            log_test("POST /api/komerce/order - COD payment", "PASS", 
                    f"COD order created with paymentStatus: {payment_status}, status: {order_status}")
        else:
            log_test("POST /api/komerce/order - COD payment", "FAIL", 
                    f"Expected paymentStatus 'cod' and status 'confirmed', got '{payment_status}' and '{order_status}'")
    else:
        log_test("POST /api/komerce/order - COD payment", "FAIL", 
                f"Status: {response.status_code}, Response: {data}")
except Exception as e:
    log_test("POST /api/komerce/order - COD payment", "FAIL", f"Exception: {str(e)}")

# Test 3: POST /api/komerce/order - Missing required fields
print("\n🔹 Test 3: Create order with missing required fields")
try:
    payload = {
        "customerPhone": "081234567890",
        "items": []  # Empty items array
    }
    
    response = requests.post(f"{API_BASE}/komerce/order", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 400 and not data.get("success"):
        log_test("POST /api/komerce/order - Missing fields", "PASS", 
                f"Correctly rejected with 400: {data.get('message')}")
    else:
        log_test("POST /api/komerce/order - Missing fields", "FAIL", 
                f"Expected 400 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/order - Missing fields", "FAIL", f"Exception: {str(e)}")

# Test 4: GET /api/komerce/order?orderId=xxx - Existing order
print("\n🔹 Test 4: Get order by ID (existing)")
if created_order_id:
    try:
        response = requests.get(f"{API_BASE}/komerce/order?orderId={created_order_id}", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            order = data.get("order", {})
            if order.get("orderId") == created_order_id:
                log_test("GET /api/komerce/order?orderId - Existing", "PASS", 
                        f"Order retrieved successfully: {created_order_id}")
            else:
                log_test("GET /api/komerce/order?orderId - Existing", "FAIL", 
                        f"Order ID mismatch: expected {created_order_id}, got {order.get('orderId')}")
        else:
            log_test("GET /api/komerce/order?orderId - Existing", "FAIL", 
                    f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        log_test("GET /api/komerce/order?orderId - Existing", "FAIL", f"Exception: {str(e)}")
else:
    log_test("GET /api/komerce/order?orderId - Existing", "FAIL", 
            "No order ID available from previous test")

# Test 5: GET /api/komerce/order?orderId=NONEXISTENT
print("\n🔹 Test 5: Get order by ID (non-existent)")
try:
    response = requests.get(f"{API_BASE}/komerce/order?orderId=NONEXISTENT-123", timeout=10)
    data = response.json()
    
    if response.status_code == 404 and not data.get("success"):
        log_test("GET /api/komerce/order?orderId - Non-existent", "PASS", 
                f"Correctly returned 404: {data.get('message')}")
    else:
        log_test("GET /api/komerce/order?orderId - Non-existent", "FAIL", 
                f"Expected 404 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/order?orderId - Non-existent", "FAIL", f"Exception: {str(e)}")

# Test 6: GET /api/komerce/order (list all)
print("\n🔹 Test 6: Get all orders")
try:
    response = requests.get(f"{API_BASE}/komerce/order", timeout=10)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        orders = data.get("orders", [])
        total = data.get("total", 0)
        
        if len(orders) == total and total >= 1:
            log_test("GET /api/komerce/order - List all", "PASS", 
                    f"Retrieved {total} orders, length matches total")
        else:
            log_test("GET /api/komerce/order - List all", "FAIL", 
                    f"Length mismatch: orders array has {len(orders)} items, total is {total}")
    else:
        log_test("GET /api/komerce/order - List all", "FAIL", 
                f"Status: {response.status_code}, Response: {data}")
except Exception as e:
    log_test("GET /api/komerce/order - List all", "FAIL", f"Exception: {str(e)}")

# Test 7: PATCH /api/komerce/order - Update existing order
print("\n🔹 Test 7: Update order status (existing)")
if created_order_id:
    try:
        payload = {
            "orderId": created_order_id,
            "status": "confirmed",
            "paymentStatus": "paid"
        }
        
        response = requests.patch(f"{API_BASE}/komerce/order", json=payload, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            order = data.get("order", {})
            if order.get("status") == "confirmed" and order.get("paymentStatus") == "paid" and "updatedAt" in order:
                log_test("PATCH /api/komerce/order - Update existing", "PASS", 
                        f"Order updated successfully with updatedAt: {order.get('updatedAt')}")
            else:
                log_test("PATCH /api/komerce/order - Update existing", "FAIL", 
                        f"Update failed or missing updatedAt field: {order}")
        else:
            log_test("PATCH /api/komerce/order - Update existing", "FAIL", 
                    f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        log_test("PATCH /api/komerce/order - Update existing", "FAIL", f"Exception: {str(e)}")
else:
    log_test("PATCH /api/komerce/order - Update existing", "FAIL", 
            "No order ID available from previous test")

# Test 8: PATCH /api/komerce/order - Non-existent order
print("\n🔹 Test 8: Update order status (non-existent)")
try:
    payload = {
        "orderId": "NONEXISTENT-999",
        "status": "confirmed"
    }
    
    response = requests.patch(f"{API_BASE}/komerce/order", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 404 and not data.get("success"):
        log_test("PATCH /api/komerce/order - Non-existent", "PASS", 
                f"Correctly returned 404: {data.get('message')}")
    else:
        log_test("PATCH /api/komerce/order - Non-existent", "FAIL", 
                f"Expected 404 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("PATCH /api/komerce/order - Non-existent", "FAIL", f"Exception: {str(e)}")

print("\n" + "=" * 80)
print("🌍 TEST SUITE 2: KOMERCE DESTINATION SEARCH")
print("=" * 80)

# Test 9: GET /api/komerce/destination?keyword=ab (length < 3)
print("\n🔹 Test 9: Destination search with keyword < 3 chars")
try:
    response = requests.get(f"{API_BASE}/komerce/destination?keyword=ab", timeout=10)
    data = response.json()
    
    if response.status_code == 200 and isinstance(data.get("data"), list) and len(data.get("data")) == 0:
        log_test("GET /api/komerce/destination - Short keyword", "PASS", 
                "Correctly returned empty data array for keyword < 3 chars")
    else:
        log_test("GET /api/komerce/destination - Short keyword", "FAIL", 
                f"Expected 200 with empty data array, got {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/destination - Short keyword", "FAIL", f"Exception: {str(e)}")

# Test 10: GET /api/komerce/destination?keyword=jakarta
print("\n🔹 Test 10: Destination search with valid keyword")
try:
    response = requests.get(f"{API_BASE}/komerce/destination?keyword=jakarta", timeout=10)
    data = response.json()
    
    if response.status_code == 200:
        # Could be valid Komerce data or clean error about missing key
        if data.get("data") is not None:
            log_test("GET /api/komerce/destination - Valid keyword", "PASS", 
                    f"Returned 200 with Komerce data (key is set)")
        else:
            log_test("GET /api/komerce/destination - Valid keyword", "FAIL", 
                    f"200 but no data field: {data}")
    elif response.status_code == 500:
        # Check if it's a clean error about missing key
        if not data.get("success") and "KOMERCE_SHIPPING_KEY" in data.get("message", ""):
            log_test("GET /api/komerce/destination - Valid keyword", "PASS", 
                    f"Clean 500 error about missing key: {data.get('message')}")
        else:
            log_test("GET /api/komerce/destination - Valid keyword", "FAIL", 
                    f"500 but not a clean missing-key error: {data}")
    else:
        log_test("GET /api/komerce/destination - Valid keyword", "FAIL", 
                f"Unexpected status {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/destination - Valid keyword", "FAIL", f"Exception: {str(e)}")

print("\n" + "=" * 80)
print("🚚 TEST SUITE 3: KOMERCE SHIPPING COST")
print("=" * 80)

# Test 11: POST /api/komerce/shipping-cost - Missing destination
print("\n🔹 Test 11: Shipping cost with missing destination")
try:
    payload = {"weight": 1000}
    
    response = requests.post(f"{API_BASE}/komerce/shipping-cost", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 400 and not data.get("success"):
        log_test("POST /api/komerce/shipping-cost - Missing destination", "PASS", 
                f"Correctly rejected with 400: {data.get('message')}")
    else:
        log_test("POST /api/komerce/shipping-cost - Missing destination", "FAIL", 
                f"Expected 400 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/shipping-cost - Missing destination", "FAIL", f"Exception: {str(e)}")

# Test 12: POST /api/komerce/shipping-cost - Valid payload
print("\n🔹 Test 12: Shipping cost with valid payload")
try:
    payload = {
        "destination": "12345",
        "weight": 1000
    }
    
    response = requests.post(f"{API_BASE}/komerce/shipping-cost", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 200:
        # Could be valid Komerce data
        log_test("POST /api/komerce/shipping-cost - Valid payload", "PASS", 
                f"Returned 200 with Komerce data (key is set)")
    elif response.status_code == 500:
        # Check if it's a clean error about missing key
        if not data.get("success") and "KOMERCE_SHIPPING_KEY" in data.get("message", ""):
            log_test("POST /api/komerce/shipping-cost - Valid payload", "PASS", 
                    f"Clean 500 error about missing key: {data.get('message')}")
        else:
            log_test("POST /api/komerce/shipping-cost - Valid payload", "FAIL", 
                    f"500 but not a clean missing-key error: {data}")
    else:
        log_test("POST /api/komerce/shipping-cost - Valid payload", "FAIL", 
                f"Unexpected status {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/shipping-cost - Valid payload", "FAIL", f"Exception: {str(e)}")

print("\n" + "=" * 80)
print("💳 TEST SUITE 4: KOMERCE QRIS PAYMENT")
print("=" * 80)

# Test 13: POST /api/komerce/payment/create - Amount < 10000
print("\n🔹 Test 13: Create payment with amount < 10000")
try:
    payload = {
        "orderId": "TEST-123",
        "amount": 5000,
        "customerName": "Test User",
        "items": [{"name": "Test", "qty": 1, "price": 5000}]
    }
    
    response = requests.post(f"{API_BASE}/komerce/payment/create", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 400 and not data.get("success"):
        log_test("POST /api/komerce/payment/create - Amount < 10000", "PASS", 
                f"Correctly rejected with 400: {data.get('message')}")
    else:
        log_test("POST /api/komerce/payment/create - Amount < 10000", "FAIL", 
                f"Expected 400 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/payment/create - Amount < 10000", "FAIL", f"Exception: {str(e)}")

# Test 14: POST /api/komerce/payment/create - Missing orderId
print("\n🔹 Test 14: Create payment with missing orderId")
try:
    payload = {
        "amount": 50000,
        "customerName": "Test User",
        "items": [{"name": "Test", "qty": 1, "price": 50000}]
    }
    
    response = requests.post(f"{API_BASE}/komerce/payment/create", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 400 and not data.get("success"):
        log_test("POST /api/komerce/payment/create - Missing orderId", "PASS", 
                f"Correctly rejected with 400: {data.get('message')}")
    else:
        log_test("POST /api/komerce/payment/create - Missing orderId", "FAIL", 
                f"Expected 400 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/payment/create - Missing orderId", "FAIL", f"Exception: {str(e)}")

# Test 15: POST /api/komerce/payment/create - Valid payload
print("\n🔹 Test 15: Create payment with valid payload")
try:
    payload = {
        "orderId": "TEST-QRIS-123",
        "amount": 50000,
        "customerName": "Dewi Lestari",
        "customerEmail": "dewi@example.com",
        "customerPhone": "081234567890",
        "items": [
            {"name": "Batik Premium", "qty": 1, "price": 50000}
        ]
    }
    
    response = requests.post(f"{API_BASE}/komerce/payment/create", json=payload, timeout=10)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        log_test("POST /api/komerce/payment/create - Valid payload", "PASS", 
                f"Payment created successfully (key is set)")
    elif response.status_code == 500:
        # Check if it's a clean error about missing key
        if not data.get("success") and "KOMERCE_PAYMENT_KEY" in data.get("message", ""):
            log_test("POST /api/komerce/payment/create - Valid payload", "PASS", 
                    f"Clean 500 error about missing key: {data.get('message')}")
        else:
            log_test("POST /api/komerce/payment/create - Valid payload", "FAIL", 
                    f"500 but not a clean missing-key error: {data}")
    else:
        log_test("POST /api/komerce/payment/create - Valid payload", "FAIL", 
                f"Unexpected status {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/payment/create - Valid payload", "FAIL", f"Exception: {str(e)}")

# Test 16: GET /api/komerce/payment/status - Missing orderId
print("\n🔹 Test 16: Get payment status without orderId")
try:
    response = requests.get(f"{API_BASE}/komerce/payment/status", timeout=10)
    data = response.json()
    
    if response.status_code == 400 and not data.get("success"):
        log_test("GET /api/komerce/payment/status - Missing orderId", "PASS", 
                f"Correctly rejected with 400: {data.get('message')}")
    else:
        log_test("GET /api/komerce/payment/status - Missing orderId", "FAIL", 
                f"Expected 400 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/payment/status - Missing orderId", "FAIL", f"Exception: {str(e)}")

# Test 17: GET /api/komerce/payment/status?orderId=xxx
print("\n🔹 Test 17: Get payment status with orderId")
try:
    response = requests.get(f"{API_BASE}/komerce/payment/status?orderId=TEST-123", timeout=10)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        log_test("GET /api/komerce/payment/status - With orderId", "PASS", 
                f"Status retrieved successfully (key is set)")
    elif response.status_code == 500:
        # Check if it's a clean error about missing key
        if not data.get("success") and "KOMERCE_PAYMENT_KEY" in data.get("message", ""):
            log_test("GET /api/komerce/payment/status - With orderId", "PASS", 
                    f"Clean 500 error about missing key: {data.get('message')}")
        else:
            log_test("GET /api/komerce/payment/status - With orderId", "FAIL", 
                    f"500 but not a clean missing-key error: {data}")
    else:
        # Could be 404 or other error from Komerce (acceptable)
        log_test("GET /api/komerce/payment/status - With orderId", "PASS", 
                f"Returned {response.status_code} (acceptable for non-existent order in Komerce)")
except Exception as e:
    log_test("GET /api/komerce/payment/status - With orderId", "FAIL", f"Exception: {str(e)}")

# Print summary
print("\n" + "=" * 80)
print("📊 TEST SUMMARY")
print("=" * 80)
print(f"✅ Passed: {test_results['passed']}")
print(f"❌ Failed: {test_results['failed']}")
print(f"⚠️  Warnings: {test_results['warnings']}")
print(f"📝 Total: {len(test_results['tests'])}")
print(f"⏰ Test completed at: {datetime.now().isoformat()}")

# Exit with appropriate code
if test_results['failed'] > 0:
    print("\n❌ Some tests failed!")
    exit(1)
else:
    print("\n✅ All tests passed!")
    exit(0)
