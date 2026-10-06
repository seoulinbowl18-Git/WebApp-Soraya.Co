#!/usr/bin/env python3
"""
Backend API Tests - ROUND 2 - LIVE Komerce Sandbox Integration
Tests Komerce endpoints with REAL API keys filled by user
Focus: Payment Create/Status with live KPAY-xxx IDs, Shipping 401 passthrough
"""

import requests
import json
import time
from datetime import datetime

# Base URL - use localhost since we're testing internally
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

print(f"🧪 ROUND 2: Testing Komerce Backend with LIVE Sandbox Keys")
print(f"📍 Base URL: {API_BASE}")
print(f"⏰ Test started at: {datetime.now().isoformat()}")
print("=" * 80)

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "info": 0,
    "tests": []
}

def log_test(name, status, message="", details=None):
    """Log test result"""
    emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "ℹ️"
    print(f"\n{emoji} {name}")
    if message:
        print(f"   {message}")
    if details:
        print(f"   Details: {json.dumps(details, indent=2, default=str)}")
    
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
        test_results["info"] += 1

# Store created payment ID for subsequent tests
created_payment_id = None
created_order_id = None

print("\n" + "=" * 80)
print("💳 TEST SUITE 1: KOMERCE QRIS PAYMENT (LIVE SANDBOX)")
print("=" * 80)

# Test 1: POST /api/komerce/payment/create - Valid payload with LIVE keys
print("\n🔹 Test 1: Create QRIS payment with valid payload (LIVE)")
try:
    unique_id = int(time.time() * 1000) % 1000000
    test_order_id = f"SRY-TEST-{unique_id}"
    
    payload = {
        "orderId": test_order_id,
        "amount": 50000,
        "customerName": "Buyer Test",
        "customerEmail": "buyer@test.com",
        "customerPhone": "08123456789",
        "items": [
            {"name": "Blouse", "qty": 1, "price": 50000}
        ]
    }
    
    response = requests.post(f"{API_BASE}/komerce/payment/create", json=payload, timeout=15)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        payment_id = data.get("paymentId", "")
        payment_url = data.get("paymentUrl", "")
        status = data.get("status", "")
        amount = data.get("amount")
        expiry = data.get("expiry")
        
        # Validate paymentId pattern (KPAY-xxx)
        if payment_id.startswith("KPAY-"):
            # Validate paymentUrl pattern
            if payment_url.startswith("https://pay-sandbox.komerce.my.id/"):
                # Validate status
                if status == "PENDING":
                    # Validate amount
                    if amount == 50000:
                        # Validate expiry exists
                        if expiry:
                            created_payment_id = payment_id
                            log_test("POST /api/komerce/payment/create - LIVE", "PASS", 
                                    f"✅ Payment created successfully with LIVE Komerce sandbox",
                                    {
                                        "paymentId": payment_id,
                                        "paymentUrl": payment_url,
                                        "status": status,
                                        "amount": amount,
                                        "expiry": expiry
                                    })
                        else:
                            log_test("POST /api/komerce/payment/create - LIVE", "FAIL", 
                                    f"Missing expiry field in response")
                    else:
                        log_test("POST /api/komerce/payment/create - LIVE", "FAIL", 
                                f"Amount mismatch: expected 50000, got {amount}")
                else:
                    log_test("POST /api/komerce/payment/create - LIVE", "FAIL", 
                            f"Status mismatch: expected 'PENDING', got '{status}'")
            else:
                log_test("POST /api/komerce/payment/create - LIVE", "FAIL", 
                        f"Invalid paymentUrl pattern: {payment_url} (expected https://pay-sandbox.komerce.my.id/...)")
        else:
            log_test("POST /api/komerce/payment/create - LIVE", "FAIL", 
                    f"Invalid paymentId pattern: {payment_id} (expected KPAY-xxx)")
    else:
        log_test("POST /api/komerce/payment/create - LIVE", "FAIL", 
                f"Status: {response.status_code}, Response: {data}")
except Exception as e:
    log_test("POST /api/komerce/payment/create - LIVE", "FAIL", f"Exception: {str(e)}")

# Test 2: POST /api/komerce/payment/create - Amount < 10000 validation
print("\n🔹 Test 2: Create payment with amount < 10000 (validation re-test)")
try:
    payload = {
        "orderId": "SRY-TEST-INVALID",
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

# Test 3: POST /api/komerce/payment/create - Missing orderId validation
print("\n🔹 Test 3: Create payment with missing orderId (validation re-test)")
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

print("\n" + "=" * 80)
print("🔍 TEST SUITE 2: KOMERCE PAYMENT STATUS (NEW CONTRACT)")
print("=" * 80)

# Test 4: GET /api/komerce/payment/status?paymentId=<KPAY-xxx>
print("\n🔹 Test 4: Get payment status with valid paymentId (LIVE)")
if created_payment_id:
    try:
        response = requests.get(f"{API_BASE}/komerce/payment/status?paymentId={created_payment_id}", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            payment_id = data.get("paymentId", "")
            status = data.get("status", "")
            amount = data.get("amount")
            expired_at = data.get("expiredAt")
            
            # Validate paymentId matches
            if payment_id == created_payment_id:
                # Validate status is PENDING (not paid yet)
                if status == "PENDING":
                    # Validate amount matches
                    if amount == 50000:
                        # Validate expiredAt exists
                        if expired_at:
                            log_test("GET /api/komerce/payment/status?paymentId - LIVE", "PASS", 
                                    f"✅ Status retrieved successfully with LIVE Komerce sandbox",
                                    {
                                        "paymentId": payment_id,
                                        "status": status,
                                        "amount": amount,
                                        "expiredAt": expired_at
                                    })
                        else:
                            log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", 
                                    f"Missing expiredAt field in response")
                    else:
                        log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", 
                                f"Amount mismatch: expected 50000, got {amount}")
                else:
                    log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", 
                            f"Status mismatch: expected 'PENDING', got '{status}'")
            else:
                log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", 
                        f"PaymentId mismatch: expected {created_payment_id}, got {payment_id}")
        else:
            log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", 
                    f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", f"Exception: {str(e)}")
else:
    log_test("GET /api/komerce/payment/status?paymentId - LIVE", "FAIL", 
            "No payment ID available from previous test")

# Test 5: GET /api/komerce/payment/status?paymentId=INVALID
print("\n🔹 Test 5: Get payment status with invalid paymentId")
try:
    response = requests.get(f"{API_BASE}/komerce/payment/status?paymentId=INVALID-123", timeout=10)
    data = response.json()
    
    # Should return 404 from Komerce (payment not found)
    if response.status_code == 404:
        log_test("GET /api/komerce/payment/status?paymentId - Invalid", "PASS", 
                f"Correctly returned 404 for invalid paymentId: {data.get('message', 'payment not found')}")
    else:
        log_test("GET /api/komerce/payment/status?paymentId - Invalid", "FAIL", 
                f"Expected 404, got {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/payment/status?paymentId - Invalid", "FAIL", f"Exception: {str(e)}")

# Test 6: GET /api/komerce/payment/status (no paymentId AND no orderId)
print("\n🔹 Test 6: Get payment status without paymentId or orderId")
try:
    response = requests.get(f"{API_BASE}/komerce/payment/status", timeout=10)
    data = response.json()
    
    if response.status_code == 400 and not data.get("success"):
        log_test("GET /api/komerce/payment/status - No params", "PASS", 
                f"Correctly rejected with 400: {data.get('message')}")
    else:
        log_test("GET /api/komerce/payment/status - No params", "FAIL", 
                f"Expected 400 with success:false, got {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/payment/status - No params", "FAIL", f"Exception: {str(e)}")

print("\n" + "=" * 80)
print("🌍 TEST SUITE 3: KOMERCE SHIPPING (401 PASSTHROUGH - INFO ONLY)")
print("=" * 80)

# Test 7: GET /api/komerce/destination?keyword=jakarta (EXPECTED 401)
print("\n🔹 Test 7: Destination search with valid keyword (EXPECTED 401 - USER ACCOUNT ISSUE)")
try:
    response = requests.get(f"{API_BASE}/komerce/destination?keyword=jakarta", timeout=10)
    data = response.json()
    
    # EXPECTED: 401 from Komerce (shipping key not active in user's account)
    if response.status_code == 401:
        log_test("GET /api/komerce/destination - 401 passthrough", "INFO", 
                f"ℹ️  EXPECTED 401 from Komerce (SHIPPING_KEY not active in user's sandbox account). This is NOT a bug in our code. Message: {data.get('error', data.get('message', 'Unauthenticated'))}")
    elif response.status_code == 200:
        # If it works, that's great!
        log_test("GET /api/komerce/destination - 401 passthrough", "PASS", 
                f"✅ Shipping key is now active! Returned 200 with data")
    else:
        # Any other status is unexpected
        log_test("GET /api/komerce/destination - 401 passthrough", "FAIL", 
                f"Unexpected status {response.status_code}: {data}")
except Exception as e:
    log_test("GET /api/komerce/destination - 401 passthrough", "FAIL", f"Exception: {str(e)}")

# Test 8: POST /api/komerce/shipping-cost (EXPECTED 401 or 404)
print("\n🔹 Test 8: Shipping cost calculation (EXPECTED 401/404 - USER ACCOUNT ISSUE)")
try:
    payload = {
        "destination": "574",
        "weight": 1000
    }
    
    response = requests.post(f"{API_BASE}/komerce/shipping-cost", json=payload, timeout=10)
    data = response.json()
    
    # EXPECTED: 401 or 404 from Komerce (shipping key not active or endpoint not available)
    if response.status_code in [401, 404]:
        log_test("POST /api/komerce/shipping-cost - 401/404 passthrough", "INFO", 
                f"ℹ️  EXPECTED {response.status_code} from Komerce (SHIPPING_KEY not active or endpoint not available in sandbox). This is NOT a bug in our code. Message: {data.get('message', 'Unauthenticated')}")
    elif response.status_code == 200:
        # If it works, that's great!
        log_test("POST /api/komerce/shipping-cost - 401/404 passthrough", "PASS", 
                f"✅ Shipping key is now active! Returned 200 with data")
    else:
        # Any other status is unexpected
        log_test("POST /api/komerce/shipping-cost - 401/404 passthrough", "FAIL", 
                f"Unexpected status {response.status_code}: {data}")
except Exception as e:
    log_test("POST /api/komerce/shipping-cost - 401/404 passthrough", "FAIL", f"Exception: {str(e)}")

# Test 9: POST /api/komerce/shipping-cost - Missing destination validation
print("\n🔹 Test 9: Shipping cost with missing destination (validation re-test)")
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

print("\n" + "=" * 80)
print("📦 TEST SUITE 4: ORDER CRUD (SANITY RE-RUN)")
print("=" * 80)

# Test 10: POST /api/komerce/order - Valid payload
print("\n🔹 Test 10: Create order with valid payload (sanity check)")
try:
    payload = {
        "customerName": "Rina Susanti",
        "customerPhone": "081298765432",
        "customerEmail": "rina@example.com",
        "destinationId": "574",
        "addressDetail": "Jl. Gatot Subroto No. 88, Denpasar",
        "courierCode": "jne",
        "courierService": "REG",
        "shippingCost": 18000,
        "paymentMethod": "QRIS",
        "subtotal": 120000,
        "items": [
            {"name": "Kebaya Modern", "qty": 1, "price": 120000}
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
            expected_total = 120000 + 18000
            actual_total = order.get("grandTotal")
            
            if actual_total == expected_total:
                log_test("POST /api/komerce/order - Sanity check", "PASS", 
                        f"Order created successfully with ID: {order_id}, grandTotal: {actual_total}")
            else:
                log_test("POST /api/komerce/order - Sanity check", "FAIL", 
                        f"grandTotal mismatch: expected {expected_total}, got {actual_total}")
        else:
            log_test("POST /api/komerce/order - Sanity check", "FAIL", 
                    f"Invalid orderId pattern: {order_id}")
    else:
        log_test("POST /api/komerce/order - Sanity check", "FAIL", 
                f"Status: {response.status_code}, Response: {data}")
except Exception as e:
    log_test("POST /api/komerce/order - Sanity check", "FAIL", f"Exception: {str(e)}")

# Test 11: GET /api/komerce/order?orderId=xxx
print("\n🔹 Test 11: Get order by ID (sanity check)")
if created_order_id:
    try:
        response = requests.get(f"{API_BASE}/komerce/order?orderId={created_order_id}", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            order = data.get("order", {})
            if order.get("orderId") == created_order_id:
                log_test("GET /api/komerce/order?orderId - Sanity check", "PASS", 
                        f"Order retrieved successfully: {created_order_id}")
            else:
                log_test("GET /api/komerce/order?orderId - Sanity check", "FAIL", 
                        f"Order ID mismatch")
        else:
            log_test("GET /api/komerce/order?orderId - Sanity check", "FAIL", 
                    f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        log_test("GET /api/komerce/order?orderId - Sanity check", "FAIL", f"Exception: {str(e)}")
else:
    log_test("GET /api/komerce/order?orderId - Sanity check", "FAIL", 
            "No order ID available from previous test")

# Test 12: GET /api/komerce/order (list all)
print("\n🔹 Test 12: Get all orders (sanity check)")
try:
    response = requests.get(f"{API_BASE}/komerce/order", timeout=10)
    data = response.json()
    
    if response.status_code == 200 and data.get("success"):
        orders = data.get("orders", [])
        total = data.get("total", 0)
        
        if len(orders) == total and total >= 1:
            log_test("GET /api/komerce/order - List all (sanity)", "PASS", 
                    f"Retrieved {total} orders")
        else:
            log_test("GET /api/komerce/order - List all (sanity)", "FAIL", 
                    f"Length mismatch: orders array has {len(orders)} items, total is {total}")
    else:
        log_test("GET /api/komerce/order - List all (sanity)", "FAIL", 
                f"Status: {response.status_code}, Response: {data}")
except Exception as e:
    log_test("GET /api/komerce/order - List all (sanity)", "FAIL", f"Exception: {str(e)}")

# Test 13: PATCH /api/komerce/order
print("\n🔹 Test 13: Update order status (sanity check)")
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
                log_test("PATCH /api/komerce/order - Sanity check", "PASS", 
                        f"Order updated successfully")
            else:
                log_test("PATCH /api/komerce/order - Sanity check", "FAIL", 
                        f"Update failed or missing updatedAt field")
        else:
            log_test("PATCH /api/komerce/order - Sanity check", "FAIL", 
                    f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        log_test("PATCH /api/komerce/order - Sanity check", "FAIL", f"Exception: {str(e)}")
else:
    log_test("PATCH /api/komerce/order - Sanity check", "FAIL", 
            "No order ID available from previous test")

# Print summary
print("\n" + "=" * 80)
print("📊 ROUND 2 TEST SUMMARY")
print("=" * 80)
print(f"✅ Passed: {test_results['passed']}")
print(f"❌ Failed: {test_results['failed']}")
print(f"ℹ️  Info (not bugs): {test_results['info']}")
print(f"📝 Total: {len(test_results['tests'])}")
print(f"⏰ Test completed at: {datetime.now().isoformat()}")

print("\n" + "=" * 80)
print("📋 IMPORTANT NOTES")
print("=" * 80)
print("ℹ️  Shipping endpoints (destination, shipping-cost) returning 401 is EXPECTED")
print("   This is a Komerce account issue (SHIPPING_KEY not active in user's sandbox)")
print("   NOT a bug in our code. User needs to verify key in Komerce dashboard.")
print("\n✅ Payment endpoints (create, status) should work with LIVE KPAY-xxx IDs")
print("   These are the critical tests for Round 2.")

# Exit with appropriate code
if test_results['failed'] > 0:
    print("\n❌ Some tests failed!")
    exit(1)
else:
    print("\n✅ All critical tests passed!")
    exit(0)
