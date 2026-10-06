#!/usr/bin/env python3
"""
ROUND 5 Backend Test - Product Price Validation & Komerce Error Fix
Tests the fix for "items[0].price is required" Komerce error.
Root cause: Product detail page was fetching /api/products/{id} which fell through to catch-all
returning wrapper {products:[...]} instead of single product → cart saved items with undefined price.

FIXES TO VERIFY:
1. NEW endpoint: GET /api/products (returns array, not wrapper)
2. NEW endpoint: GET /api/products/[id] (returns single product, not wrapper)
3. Defensive validation at /api/checkout/session (normalizes price/amount/cost fields)
4. Defensive validation at /api/payment/snap
5. Defensive validation at /api/komerce/payment/create
"""

import requests
import json
import sys

# Backend URL - use localhost since we're testing internally
BASE_URL = "http://localhost:3000"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"   {details}")
    print()

def test_get_products_list():
    """Test 1: GET /api/products should return array of products (not wrapper)"""
    print("=" * 80)
    print("TEST 1: GET /api/products")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response type: {type(data)}")
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        assert len(data) >= 3, f"Expected >= 3 products, got {len(data)}"
        
        # Verify each product has required fields
        for product in data:
            assert "id" in product, "product missing id"
            assert "name" in product, "product missing name"
            assert "price" in product, "product missing price"
            assert "image" in product, "product missing image"
            assert isinstance(product["price"], (int, float)), f"price should be number, got {type(product['price'])}"
            assert product["price"] > 0, f"price should be > 0, got {product['price']}"
        
        print_test("GET /api/products returns array of products", True, 
                   f"Found {len(data)} products, all with id/name/price/image")
        return True
    except AssertionError as e:
        print_test("GET /api/products returns array of products", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products returns array of products", False, f"Exception: {str(e)}")
        return False

def test_get_product_by_id():
    """Test 2: GET /api/products/1 should return single product (not wrapper)"""
    print("=" * 80)
    print("TEST 2: GET /api/products/1")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/1", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert isinstance(data, dict), f"Expected object, got {type(data)}"
        assert "id" in data, "product missing id"
        assert "name" in data, "product missing name"
        assert "price" in data, "product missing price"
        assert data["price"] == 185000, f"Expected price 185000, got {data['price']}"
        assert data["name"] == "Soraya Blouse Linen Beige", f"Expected 'Soraya Blouse Linen Beige', got {data['name']}"
        
        # Verify it's NOT a wrapper (no "products" key)
        assert "products" not in data, "Response should NOT be a wrapper with 'products' key"
        
        print_test("GET /api/products/1 returns single product", True, 
                   f"Product: {data['name']}, Price: Rp {data['price']}")
        return True
    except AssertionError as e:
        print_test("GET /api/products/1 returns single product", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products/1 returns single product", False, f"Exception: {str(e)}")
        return False

def test_get_product_not_found():
    """Test 3: GET /api/products/999 should return 404"""
    print("=" * 80)
    print("TEST 3: GET /api/products/999")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/999", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        assert data.get("success") == False, "success should be false"
        assert "error" in data or "message" in data, "error/message key missing"
        
        print_test("GET /api/products/999 returns 404", True, 
                   f"Validation works: {data.get('error') or data.get('message')}")
        return True
    except AssertionError as e:
        print_test("GET /api/products/999 returns 404", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products/999 returns 404", False, f"Exception: {str(e)}")
        return False

def test_checkout_session_missing_price():
    """Test 4: POST /api/checkout/session with items missing price should return 400"""
    print("=" * 80)
    print("TEST 4: POST /api/checkout/session with items missing price")
    print("=" * 80)
    
    try:
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Test Product"
                    # NO price field
                }
            ],
            "customer": {
                "name": "Siti Nurhaliza",
                "phone": "08123456789",
                "email": "siti@example.com",
                "address": "Jl. Sudirman No. 123",
                "destination": {
                    "id": "LOCAL-JKT-01",
                    "text": "Jakarta Pusat"
                }
            },
            "shipping": {
                "service": "jne",
                "service_name": "JNE REG",
                "price": 15000
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert data.get("success") == False, "success should be false"
        assert "message" in data, "message key missing"
        assert "tidak memiliki harga valid" in data["message"].lower(), \
            f"Expected message about invalid price, got: {data['message']}"
        assert "debug" in data, "debug key missing"
        assert "invalidItem" in data["debug"], "debug.invalidItem missing"
        
        print_test("Checkout session rejects items without price", True, 
                   f"Validation works: {data['message']}")
        return True
    except AssertionError as e:
        print_test("Checkout session rejects items without price", False, str(e))
        return False
    except Exception as e:
        print_test("Checkout session rejects items without price", False, f"Exception: {str(e)}")
        return False

def test_checkout_session_zero_price():
    """Test 5: POST /api/checkout/session with items having price=0 should return 400"""
    print("=" * 80)
    print("TEST 5: POST /api/checkout/session with items having price=0")
    print("=" * 80)
    
    try:
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Test Product",
                    "price": 0
                }
            ],
            "customer": {
                "name": "Ahmad Dhani",
                "phone": "08123456789",
                "email": "ahmad@example.com",
                "address": "Jl. Gatot Subroto No. 456",
                "destination": {
                    "id": "LOCAL-JKT-02",
                    "text": "Jakarta Selatan"
                }
            },
            "shipping": {
                "service": "jne",
                "service_name": "JNE REG",
                "price": 15000
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert data.get("success") == False, "success should be false"
        assert "message" in data, "message key missing"
        assert "tidak memiliki harga valid" in data["message"].lower(), \
            f"Expected message about invalid price, got: {data['message']}"
        
        print_test("Checkout session rejects items with price=0", True, 
                   f"Validation works: {data['message']}")
        return True
    except AssertionError as e:
        print_test("Checkout session rejects items with price=0", False, str(e))
        return False
    except Exception as e:
        print_test("Checkout session rejects items with price=0", False, f"Exception: {str(e)}")
        return False

def test_checkout_session_amount_alias():
    """Test 6: POST /api/checkout/session with items using 'amount' field should work"""
    print("=" * 80)
    print("TEST 6: POST /api/checkout/session with items using 'amount' field")
    print("=" * 80)
    
    try:
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Soraya Blouse",
                    "amount": 185000  # Using 'amount' instead of 'price'
                }
            ],
            "customer": {
                "name": "Raisa Andriana",
                "phone": "08123456789",
                "email": "raisa@example.com",
                "address": "Jl. Thamrin No. 789",
                "destination": {
                    "id": "LOCAL-JKT-03",
                    "text": "Jakarta Barat"
                }
            },
            "shipping": {
                "service": "jne",
                "service_name": "JNE REG",
                "price": 15000
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "order" in data, "order key missing"
        
        # Verify order was created with correct price normalization
        order = data["order"]
        assert "id" in order, "order.id missing"
        assert order["subtotal"] == 185000, f"Expected subtotal 185000, got {order['subtotal']}"
        assert order["grandTotal"] == 200000, f"Expected grandTotal 200000 (185000+15000), got {order['grandTotal']}"
        
        # Verify the order in storage has normalized price
        resp2 = requests.get(f"{BASE_URL}/api/checkout/session?orderId={order['id']}", timeout=10)
        assert resp2.status_code == 200, f"Failed to fetch order: {resp2.status_code}"
        order_data = resp2.json()
        assert order_data.get("success") == True, "Failed to fetch order"
        stored_order = order_data["order"]
        assert stored_order["items"][0]["price"] == 185000, \
            f"Expected normalized price 185000, got {stored_order['items'][0]['price']}"
        
        print_test("Checkout session accepts 'amount' field alias", True, 
                   f"Order created: {order['id']}, amount normalized to price: Rp 185,000")
        return True
    except AssertionError as e:
        print_test("Checkout session accepts 'amount' field alias", False, str(e))
        return False
    except Exception as e:
        print_test("Checkout session accepts 'amount' field alias", False, f"Exception: {str(e)}")
        return False

def test_checkout_session_cost_alias():
    """Test 7: POST /api/checkout/session with items using 'cost' field should work"""
    print("=" * 80)
    print("TEST 7: POST /api/checkout/session with items using 'cost' field")
    print("=" * 80)
    
    try:
        payload = {
            "items": [
                {
                    "id": "2",
                    "qty": 1,
                    "name": "Atasan Katun",
                    "cost": 150000  # Using 'cost' instead of 'price'
                }
            ],
            "customer": {
                "name": "Isyana Sarasvati",
                "phone": "08123456789",
                "email": "isyana@example.com",
                "address": "Jl. Kuningan No. 321",
                "destination": {
                    "id": "LOCAL-JKT-04",
                    "text": "Jakarta Timur"
                }
            },
            "shipping": {
                "service": "jnt",
                "service_name": "J&T Express",
                "price": 14000
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "order" in data, "order key missing"
        
        order = data["order"]
        assert order["subtotal"] == 150000, f"Expected subtotal 150000, got {order['subtotal']}"
        assert order["grandTotal"] == 164000, f"Expected grandTotal 164000 (150000+14000), got {order['grandTotal']}"
        
        print_test("Checkout session accepts 'cost' field alias", True, 
                   f"Order created: {order['id']}, cost normalized to price: Rp 150,000")
        return True
    except AssertionError as e:
        print_test("Checkout session accepts 'cost' field alias", False, str(e))
        return False
    except Exception as e:
        print_test("Checkout session accepts 'cost' field alias", False, f"Exception: {str(e)}")
        return False

def test_checkout_session_valid_price():
    """Test 8: POST /api/checkout/session with valid price field should work"""
    print("=" * 80)
    print("TEST 8: POST /api/checkout/session with valid price field")
    print("=" * 80)
    
    try:
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Soraya Blouse Linen Beige",
                    "price": 185000,
                    "image": "https://example.com/blouse.jpg"
                }
            ],
            "customer": {
                "name": "Bunga Citra Lestari",
                "phone": "08123456789",
                "email": "bcl@example.com",
                "address": "Jl. Senopati No. 654",
                "destination": {
                    "id": "LOCAL-JKT-05",
                    "text": "Jakarta Utara"
                }
            },
            "shipping": {
                "service": "sicepat",
                "service_name": "SiCepat REG",
                "price": 13000
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "order" in data, "order key missing"
        
        order = data["order"]
        assert order["subtotal"] == 185000, f"Expected subtotal 185000, got {order['subtotal']}"
        assert order["grandTotal"] == 198000, f"Expected grandTotal 198000 (185000+13000), got {order['grandTotal']}"
        
        # Verify the stored order has correct price
        resp2 = requests.get(f"{BASE_URL}/api/checkout/session?orderId={order['id']}", timeout=10)
        assert resp2.status_code == 200, f"Failed to fetch order: {resp2.status_code}"
        order_data = resp2.json()
        stored_order = order_data["order"]
        assert stored_order["items"][0]["price"] == 185000, \
            f"Expected price 185000, got {stored_order['items'][0]['price']}"
        
        print_test("Checkout session with valid price works correctly", True, 
                   f"Order created: {order['id']}, price: Rp 185,000")
        return order["id"]  # Return orderId for next test
    except AssertionError as e:
        print_test("Checkout session with valid price works correctly", False, str(e))
        return None
    except Exception as e:
        print_test("Checkout session with valid price works correctly", False, f"Exception: {str(e)}")
        return None

def test_payment_snap_valid_order(order_id):
    """Test 9: POST /api/payment/snap with valid orderId should create QRIS payment"""
    print("=" * 80)
    print("TEST 9: POST /api/payment/snap with valid orderId")
    print("=" * 80)
    
    if not order_id:
        print_test("Payment snap with valid order", False, "No orderId from previous test")
        return False
    
    try:
        payload = {
            "orderId": order_id
        }
        resp = requests.post(f"{BASE_URL}/api/payment/snap", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "paymentId" in data, "paymentId key missing"
        assert "redirect_url" in data, "redirect_url key missing"
        
        # Verify Komerce payment ID format
        assert data["paymentId"].startswith("KPAY-"), \
            f"Expected paymentId to start with 'KPAY-', got: {data['paymentId']}"
        
        # Verify Komerce payment URL format
        assert data["redirect_url"].startswith("https://pay-sandbox.komerce.my.id/"), \
            f"Expected redirect_url to start with 'https://pay-sandbox.komerce.my.id/', got: {data['redirect_url']}"
        
        # Verify amount matches order
        assert data["amount"] == 198000, f"Expected amount 198000, got {data['amount']}"
        
        print_test("Payment snap creates QRIS payment successfully", True, 
                   f"PaymentID: {data['paymentId']}, Amount: Rp {data['amount']}")
        return True
    except AssertionError as e:
        print_test("Payment snap creates QRIS payment successfully", False, str(e))
        return False
    except Exception as e:
        print_test("Payment snap creates QRIS payment successfully", False, f"Exception: {str(e)}")
        return False

def test_komerce_payment_create_missing_price():
    """Test 10: POST /api/komerce/payment/create with items missing price should return 400"""
    print("=" * 80)
    print("TEST 10: POST /api/komerce/payment/create with items missing price")
    print("=" * 80)
    
    try:
        payload = {
            "orderId": "TEST-ORDER-001",
            "amount": 50000,
            "customerName": "Tulus",
            "customerEmail": "tulus@example.com",
            "customerPhone": "08123456789",
            "items": [
                {
                    "name": "Test Product",
                    "qty": 1
                    # NO price field
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/komerce/payment/create", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert data.get("success") == False, "success should be false"
        assert "message" in data, "message key missing"
        assert "tidak valid" in data["message"].lower() or "tidak ada item" in data["message"].lower(), \
            f"Expected message about invalid items, got: {data['message']}"
        
        print_test("Komerce payment create rejects items without price", True, 
                   f"Validation works: {data['message']}")
        return True
    except AssertionError as e:
        print_test("Komerce payment create rejects items without price", False, str(e))
        return False
    except Exception as e:
        print_test("Komerce payment create rejects items without price", False, f"Exception: {str(e)}")
        return False

def test_komerce_payment_create_amount_alias():
    """Test 11: POST /api/komerce/payment/create with items using 'amount' field should work"""
    print("=" * 80)
    print("TEST 11: POST /api/komerce/payment/create with items using 'amount' field")
    print("=" * 80)
    
    try:
        payload = {
            "orderId": "TEST-ORDER-002",
            "amount": 50000,
            "customerName": "Afgan Syahreza",
            "customerEmail": "afgan@example.com",
            "customerPhone": "08123456789",
            "items": [
                {
                    "name": "Test Product",
                    "qty": 1,
                    "amount": 50000  # Using 'amount' instead of 'price'
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/komerce/payment/create", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "paymentId" in data, "paymentId key missing"
        
        # Verify Komerce payment ID format
        assert data["paymentId"].startswith("KPAY-"), \
            f"Expected paymentId to start with 'KPAY-', got: {data['paymentId']}"
        
        print_test("Komerce payment create accepts 'amount' field alias", True, 
                   f"PaymentID: {data['paymentId']}, amount normalized successfully")
        return True
    except AssertionError as e:
        print_test("Komerce payment create accepts 'amount' field alias", False, str(e))
        return False
    except Exception as e:
        print_test("Komerce payment create accepts 'amount' field alias", False, f"Exception: {str(e)}")
        return False

def test_full_e2e_regression():
    """Test 12: Full E2E regression - search → calculate → checkout → payment"""
    print("=" * 80)
    print("TEST 12: FULL E2E REGRESSION")
    print("=" * 80)
    
    try:
        # Step 1: Search location
        print("\nStep 1: Search yogyakarta...")
        resp = requests.get(f"{BASE_URL}/api/shipping/search-location?search=yogyakarta", timeout=10)
        assert resp.status_code == 200, f"Search failed: {resp.status_code}"
        data = resp.json()
        assert len(data["items"]) > 0, "No items found"
        destination = data["items"][0]
        print(f"✓ Selected destination: {destination['id']} - {destination['text']}")
        
        # Step 2: Calculate shipping cost
        print("\nStep 2: Calculate shipping cost...")
        payload = {
            "destinationDistrictId": destination["id"],
            "weight": 1000,
            "itemValue": 185000
        }
        resp = requests.post(f"{BASE_URL}/api/shipping/calculate-cost", json=payload, timeout=10)
        assert resp.status_code == 200, f"Calculate cost failed: {resp.status_code}"
        data = resp.json()
        assert len(data["options"]) > 0, "No shipping options found"
        shipping = data["options"][0]
        print(f"✓ Selected shipping: {shipping['service_name']} - Rp {shipping['price']}")
        
        # Step 3: Create checkout session with VALID price field
        print("\nStep 3: Create checkout session...")
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Soraya Blouse Linen Beige",
                    "price": 185000,  # Valid price field
                    "image": "https://example.com/blouse.jpg"
                }
            ],
            "customer": {
                "name": "Dewi Sandra",
                "phone": "08123456789",
                "email": "dewi@example.com",
                "address": "Jl. Malioboro No. 99",
                "destination": destination
            },
            "shipping": shipping
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        assert resp.status_code == 200, f"Checkout session failed: {resp.status_code}"
        data = resp.json()
        assert data.get("success") == True, "Checkout session failed"
        assert "order" in data, "order key missing"
        order = data["order"]
        print(f"✓ Order created: {order['id']} - Rp {order['grandTotal']}")
        
        # Step 4: Create QRIS payment
        print("\nStep 4: Create QRIS payment...")
        payload = {
            "orderId": order["id"]
        }
        resp = requests.post(f"{BASE_URL}/api/payment/snap", json=payload, timeout=10)
        assert resp.status_code == 200, f"Payment creation failed: {resp.status_code}"
        data = resp.json()
        assert data.get("success") == True, "Payment creation failed"
        assert "redirect_url" in data, "redirect_url key missing"
        assert "paymentId" in data, "paymentId key missing"
        
        # Verify Komerce real response
        assert data["redirect_url"].startswith("https://pay-sandbox.komerce.my.id/"), \
            f"Invalid redirect_url: {data['redirect_url']}"
        assert data["paymentId"].startswith("KPAY-"), \
            f"Invalid paymentId: {data['paymentId']}"
        assert data["amount"] == order["grandTotal"], \
            f"Amount mismatch: {data['amount']} != {order['grandTotal']}"
        
        print(f"✓ Payment created: {data['paymentId']}")
        print(f"✓ Payment URL: {data['redirect_url']}")
        print(f"✓ Amount: Rp {data['amount']}")
        
        print_test("Full E2E regression works seamlessly", True, 
                   f"Order {order['id']} → Payment {data['paymentId']} → Rp {data['amount']}")
        return True
    except AssertionError as e:
        print_test("Full E2E regression works seamlessly", False, str(e))
        return False
    except Exception as e:
        print_test("Full E2E regression works seamlessly", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "=" * 80)
    print("ROUND 5 BACKEND TEST - PRODUCT PRICE VALIDATION & KOMERCE ERROR FIX")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print("=" * 80 + "\n")
    
    results = []
    order_id = None
    
    # Run all tests
    results.append(("GET /api/products", test_get_products_list()))
    results.append(("GET /api/products/1", test_get_product_by_id()))
    results.append(("GET /api/products/999", test_get_product_not_found()))
    results.append(("Checkout session - missing price", test_checkout_session_missing_price()))
    results.append(("Checkout session - zero price", test_checkout_session_zero_price()))
    results.append(("Checkout session - amount alias", test_checkout_session_amount_alias()))
    results.append(("Checkout session - cost alias", test_checkout_session_cost_alias()))
    
    # Test 8 returns orderId for test 9
    order_id = test_checkout_session_valid_price()
    results.append(("Checkout session - valid price", order_id is not None))
    
    results.append(("Payment snap - valid order", test_payment_snap_valid_order(order_id)))
    results.append(("Komerce payment create - missing price", test_komerce_payment_create_missing_price()))
    results.append(("Komerce payment create - amount alias", test_komerce_payment_create_amount_alias()))
    results.append(("Full E2E regression", test_full_e2e_regression()))
    
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
        print("🎉 ALL TESTS PASSED! Product price validation and Komerce error fix working perfectly.")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the failures above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
