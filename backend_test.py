#!/usr/bin/env python3
"""
ROUND 4 Backend Test - Shipping Fallback Mechanism
Tests the automatic fallback to local Indonesian city catalog when Komerce shipping API fails.
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

def test_search_location_yogyakarta():
    """Test 1: Search yogyakarta should return fallback items with LOCAL-YGY-* ids"""
    print("=" * 80)
    print("TEST 1: GET /api/shipping/search-location?search=yogyakarta")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/shipping/search-location?search=yogyakarta", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify response structure
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "items" in data, "items key missing"
        assert isinstance(data["items"], list), "items should be array"
        assert len(data["items"]) > 0, "items should not be empty (expect 4 Yogya areas)"
        assert data.get("source") == "fallback", f"source should be 'fallback', got {data.get('source')}"
        
        # Verify each item has correct structure
        for item in data["items"]:
            assert "id" in item, "item missing id"
            assert "text" in item, "item missing text"
            assert item["id"].startswith("LOCAL-"), f"id should start with LOCAL-, got {item['id']}"
            assert item.get("fallback") == True, "item should have fallback: true"
        
        # Verify notice field
        assert "notice" in data, "notice field missing"
        assert len(data["notice"]) > 0, "notice should not be empty"
        
        print_test("Search yogyakarta returns fallback items", True, 
                   f"Found {len(data['items'])} items, all with LOCAL- prefix, source: fallback")
        return True
    except AssertionError as e:
        print_test("Search yogyakarta returns fallback items", False, str(e))
        return False
    except Exception as e:
        print_test("Search yogyakarta returns fallback items", False, f"Exception: {str(e)}")
        return False

def test_search_location_jakarta():
    """Test 2: Search jakarta should return many fallback items with LOCAL-JKT-* ids"""
    print("=" * 80)
    print("TEST 2: GET /api/shipping/search-location?search=jakarta")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/shipping/search-location?search=jakarta", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response items count: {len(data.get('items', []))}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert len(data["items"]) > 10, f"Expected > 10 Jakarta items, got {len(data['items'])}"
        assert data.get("source") == "fallback", f"source should be 'fallback', got {data.get('source')}"
        
        # Verify all items have LOCAL-JKT- prefix
        jkt_items = [item for item in data["items"] if "JKT" in item["id"]]
        assert len(jkt_items) > 10, f"Expected > 10 items with JKT in id, got {len(jkt_items)}"
        
        print_test("Search jakarta returns many fallback items", True, 
                   f"Found {len(data['items'])} items, {len(jkt_items)} with JKT in id")
        return True
    except AssertionError as e:
        print_test("Search jakarta returns many fallback items", False, str(e))
        return False
    except Exception as e:
        print_test("Search jakarta returns many fallback items", False, f"Exception: {str(e)}")
        return False

def test_search_location_no_match():
    """Test 3: Search with no match should return empty items array"""
    print("=" * 80)
    print("TEST 3: GET /api/shipping/search-location?search=zxcvbnm123")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/shipping/search-location?search=zxcvbnm123", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert len(data["items"]) == 0, f"Expected empty items, got {len(data['items'])}"
        assert data.get("source") == "fallback", f"source should be 'fallback', got {data.get('source')}"
        
        print_test("Search with no match returns empty items", True, "Empty items array as expected")
        return True
    except AssertionError as e:
        print_test("Search with no match returns empty items", False, str(e))
        return False
    except Exception as e:
        print_test("Search with no match returns empty items", False, f"Exception: {str(e)}")
        return False

def test_search_location_short_keyword():
    """Test 4: Search with < 3 chars should return empty items"""
    print("=" * 80)
    print("TEST 4: GET /api/shipping/search-location?search=ab")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/shipping/search-location?search=ab", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert len(data["items"]) == 0, f"Expected empty items, got {len(data['items'])}"
        assert data.get("source") == "empty", f"source should be 'empty', got {data.get('source')}"
        
        print_test("Search with < 3 chars returns empty items", True, "Empty items with source: empty")
        return True
    except AssertionError as e:
        print_test("Search with < 3 chars returns empty items", False, str(e))
        return False
    except Exception as e:
        print_test("Search with < 3 chars returns empty items", False, f"Exception: {str(e)}")
        return False

def test_calculate_cost_local_yogya():
    """Test 5: Calculate cost with LOCAL-YGY-02 should return fallback rates"""
    print("=" * 80)
    print("TEST 5: POST /api/shipping/calculate-cost with LOCAL-YGY-02")
    print("=" * 80)
    
    try:
        payload = {
            "destinationDistrictId": "LOCAL-YGY-02",
            "weight": 1000,
            "itemValue": 185000
        }
        resp = requests.post(f"{BASE_URL}/api/shipping/calculate-cost", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert "options" in data, "options key missing"
        assert len(data["options"]) >= 3, f"Expected >= 3 options, got {len(data['options'])}"
        assert data.get("source") == "fallback", f"source should be 'fallback', got {data.get('source')}"
        
        # Verify each option has correct structure
        services = []
        for option in data["options"]:
            assert "service" in option, "option missing service"
            assert "service_name" in option, "option missing service_name"
            assert "price" in option, "option missing price"
            assert "estimated_days" in option, "option missing estimated_days"
            assert option.get("fallback") == True, "option should have fallback: true"
            assert option["price"] > 0, f"price should be > 0, got {option['price']}"
            services.append(option["service"])
        
        # Verify we have expected couriers (jne, jnt, sicepat, anteraja)
        expected_services = ["jne", "jnt", "sicepat", "anteraja"]
        for svc in expected_services:
            assert svc in services, f"Expected service '{svc}' not found in options"
        
        print_test("Calculate cost with LOCAL-YGY-02 returns fallback rates", True, 
                   f"Found {len(data['options'])} options: {', '.join(services)}, source: fallback")
        return True
    except AssertionError as e:
        print_test("Calculate cost with LOCAL-YGY-02 returns fallback rates", False, str(e))
        return False
    except Exception as e:
        print_test("Calculate cost with LOCAL-YGY-02 returns fallback rates", False, f"Exception: {str(e)}")
        return False

def test_calculate_cost_local_jakarta():
    """Test 6: Calculate cost with LOCAL-JKT-01 should return jabodetabek rates"""
    print("=" * 80)
    print("TEST 6: POST /api/shipping/calculate-cost with LOCAL-JKT-01")
    print("=" * 80)
    
    try:
        payload = {
            "destinationDistrictId": "LOCAL-JKT-01",
            "weight": 1000,
            "itemValue": 50000
        }
        resp = requests.post(f"{BASE_URL}/api/shipping/calculate-cost", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert len(data["options"]) >= 3, f"Expected >= 3 options, got {len(data['options'])}"
        assert data.get("source") == "fallback", f"source should be 'fallback', got {data.get('source')}"
        
        # Verify jabodetabek rates (should include gosend)
        services = [opt["service"] for opt in data["options"]]
        
        print_test("Calculate cost with LOCAL-JKT-01 returns jabodetabek rates", True, 
                   f"Found {len(data['options'])} options: {', '.join(services)}")
        return True
    except AssertionError as e:
        print_test("Calculate cost with LOCAL-JKT-01 returns jabodetabek rates", False, str(e))
        return False
    except Exception as e:
        print_test("Calculate cost with LOCAL-JKT-01 returns jabodetabek rates", False, f"Exception: {str(e)}")
        return False

def test_calculate_cost_numeric_id_fallback():
    """Test 7: Calculate cost with numeric ID (Komerce will fail) should fallback silently"""
    print("=" * 80)
    print("TEST 7: POST /api/shipping/calculate-cost with numeric ID 574")
    print("=" * 80)
    
    try:
        payload = {
            "destinationDistrictId": "574",
            "weight": 1000,
            "itemValue": 50000
        }
        resp = requests.post(f"{BASE_URL}/api/shipping/calculate-cost", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get("success") == True, "success should be true"
        assert len(data["options"]) > 0, f"Expected options, got {len(data['options'])}"
        assert data.get("source") == "fallback", f"source should be 'fallback', got {data.get('source')}"
        
        print_test("Calculate cost with numeric ID falls back silently", True, 
                   f"Komerce failed (401), returned {len(data['options'])} default options")
        return True
    except AssertionError as e:
        print_test("Calculate cost with numeric ID falls back silently", False, str(e))
        return False
    except Exception as e:
        print_test("Calculate cost with numeric ID falls back silently", False, f"Exception: {str(e)}")
        return False

def test_calculate_cost_missing_destination():
    """Test 8: Calculate cost without destinationDistrictId should return 400"""
    print("=" * 80)
    print("TEST 8: POST /api/shipping/calculate-cost with missing destinationDistrictId")
    print("=" * 80)
    
    try:
        payload = {
            "weight": 1000,
            "itemValue": 50000
        }
        resp = requests.post(f"{BASE_URL}/api/shipping/calculate-cost", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        assert data.get("success") == False, "success should be false"
        assert "message" in data, "message key missing"
        
        print_test("Calculate cost without destinationDistrictId returns 400", True, 
                   f"Validation works: {data.get('message')}")
        return True
    except AssertionError as e:
        print_test("Calculate cost without destinationDistrictId returns 400", False, str(e))
        return False
    except Exception as e:
        print_test("Calculate cost without destinationDistrictId returns 400", False, f"Exception: {str(e)}")
        return False

def test_full_e2e_flow():
    """Test 9: Full E2E flow - search → calculate → checkout → payment"""
    print("=" * 80)
    print("TEST 9: FULL E2E FLOW")
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
        
        # Step 3: Create checkout session
        print("\nStep 3: Create checkout session...")
        payload = {
            "items": [
                {
                    "id": "1",
                    "qty": 1,
                    "name": "Blouse Soraya",
                    "price": 185000,
                    "image": "https://example.com/blouse.jpg"
                }
            ],
            "customer": {
                "name": "Amanah Focus",
                "phone": "08205526665",
                "email": "focusamanah@gmail.com",
                "address": "Jl Kaliurang 87",
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
        
        # Step 4: Create payment
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
        assert data["redirect_url"].startswith("https://pay-sandbox.komerce.my.id/"), \
            f"Invalid redirect_url: {data['redirect_url']}"
        assert data["paymentId"].startswith("KPAY-"), \
            f"Invalid paymentId: {data['paymentId']}"
        assert data["amount"] == order["grandTotal"], \
            f"Amount mismatch: {data['amount']} != {order['grandTotal']}"
        
        print(f"✓ Payment created: {data['paymentId']}")
        print(f"✓ Payment URL: {data['redirect_url']}")
        print(f"✓ Amount: Rp {data['amount']}")
        
        print_test("Full E2E flow works seamlessly", True, 
                   f"Order {order['id']} → Payment {data['paymentId']} → Rp {data['amount']}")
        return True
    except AssertionError as e:
        print_test("Full E2E flow works seamlessly", False, str(e))
        return False
    except Exception as e:
        print_test("Full E2E flow works seamlessly", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "=" * 80)
    print("ROUND 4 BACKEND TEST - SHIPPING FALLBACK MECHANISM")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print("=" * 80 + "\n")
    
    results = []
    
    # Run all tests
    results.append(("Search yogyakarta", test_search_location_yogyakarta()))
    results.append(("Search jakarta", test_search_location_jakarta()))
    results.append(("Search no match", test_search_location_no_match()))
    results.append(("Search short keyword", test_search_location_short_keyword()))
    results.append(("Calculate cost LOCAL-YGY-02", test_calculate_cost_local_yogya()))
    results.append(("Calculate cost LOCAL-JKT-01", test_calculate_cost_local_jakarta()))
    results.append(("Calculate cost numeric ID", test_calculate_cost_numeric_id_fallback()))
    results.append(("Calculate cost missing destination", test_calculate_cost_missing_destination()))
    results.append(("Full E2E flow", test_full_e2e_flow()))
    
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
        print("🎉 ALL TESTS PASSED! Shipping fallback mechanism working perfectly.")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the failures above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
