#!/usr/bin/env python3
"""
ROUND 6 Backend Test - Real Product Catalog from Excel
Tests that dummy products were replaced with user's actual catalog (8 products).
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

def test_products_list():
    """Test 1: GET /api/products should return 8 products with correct structure"""
    print("=" * 80)
    print("TEST 1: GET /api/products - Verify 8 products from real catalog")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        
        # Verify response is array
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        assert len(data) == 8, f"Expected 8 products, got {len(data)}"
        
        # Verify each product has required fields
        expected_names = [
            "Tunik Rayon Maroon Polos",
            "Gamis Maxy Motif Bunga",
            "Blouse Kancing Depan",
            "Midi Dress Rayon Polos",
            "Setelan Kulot Rayon",
            "Piyama Set Katun Motif",
            "Oversize Blouse Motif",
            "Alysa Blouse"
        ]
        
        product_names = []
        for product in data:
            # Verify structure
            assert "id" in product, "Product missing id"
            assert "name" in product, "Product missing name"
            assert "price" in product, "Product missing price"
            assert "image" in product, "Product missing image"
            assert "sizes" in product, "Product missing sizes"
            assert "variants" in product, "Product missing variants"
            
            # Verify types
            assert isinstance(product["id"], str), f"id should be string, got {type(product['id'])}"
            assert isinstance(product["name"], str), f"name should be string, got {type(product['name'])}"
            assert isinstance(product["price"], (int, float)), f"price should be number, got {type(product['price'])}"
            assert product["price"] > 0, f"price should be > 0, got {product['price']}"
            assert isinstance(product["image"], str), f"image should be string, got {type(product['image'])}"
            assert product["image"].startswith("https://"), f"image should start with https://, got {product['image']}"
            assert isinstance(product["sizes"], list), f"sizes should be array, got {type(product['sizes'])}"
            assert len(product["sizes"]) >= 1, f"sizes should have at least 1 item, got {len(product['sizes'])}"
            assert isinstance(product["variants"], list), f"variants should be array, got {type(product['variants'])}"
            
            product_names.append(product["name"])
        
        # Verify expected product names are present
        for expected_name in expected_names:
            # Check if any product name contains the expected name (partial match)
            found = any(expected_name in name for name in product_names)
            assert found, f"Expected product '{expected_name}' not found in catalog"
        
        # Verify old dummy products are GONE
        old_dummy_names = [
            "Soraya Blouse Linen Beige",
            "Atasan Katun Hitam Minimal",
            "Tunik Rayon Monokrom"
        ]
        for old_name in old_dummy_names:
            found = any(old_name in name for name in product_names)
            assert not found, f"Old dummy product '{old_name}' should be removed but still present"
        
        print(f"Product names found:")
        for i, name in enumerate(product_names, 1):
            print(f"  {i}. {name}")
        
        print_test("GET /api/products returns 8 real products", True, 
                   f"All 8 products have valid structure, old dummy products removed")
        return True
    except AssertionError as e:
        print_test("GET /api/products returns 8 real products", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products returns 8 real products", False, f"Exception: {str(e)}")
        return False

def test_product_detail_1():
    """Test 2: GET /api/products/1 should return Tunik Rayon Maroon Polos"""
    print("=" * 80)
    print("TEST 2: GET /api/products/1 - Tunik Rayon Maroon Polos")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/1", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Product: {data.get('name')}")
        print(f"Price: {data.get('price')}")
        print(f"Sizes: {data.get('sizes')}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "Tunik Rayon Maroon Polos" in data.get("name", ""), \
            f"Expected 'Tunik Rayon Maroon Polos', got '{data.get('name')}'"
        assert data.get("price") == 129000, f"Expected price 129000, got {data.get('price')}"
        assert "All Size (Fit L)" in data.get("sizes", []), \
            f"Expected 'All Size (Fit L)' in sizes, got {data.get('sizes')}"
        
        print_test("GET /api/products/1 returns Tunik Rayon Maroon Polos", True, 
                   f"Price: {data['price']}, Sizes: {data['sizes']}")
        return True
    except AssertionError as e:
        print_test("GET /api/products/1 returns Tunik Rayon Maroon Polos", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products/1 returns Tunik Rayon Maroon Polos", False, f"Exception: {str(e)}")
        return False

def test_product_detail_7():
    """Test 3: GET /api/products/7 should return Oversize Blouse with 35 variants"""
    print("=" * 80)
    print("TEST 3: GET /api/products/7 - Oversize Blouse Motif with 35 variants")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/7", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Product: {data.get('name')}")
        print(f"Price: {data.get('price')}")
        print(f"Variants count: {len(data.get('variants', []))}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "Oversize Blouse Motif" in data.get("name", ""), \
            f"Expected 'Oversize Blouse Motif' in name, got '{data.get('name')}'"
        assert data.get("price") == 79000, f"Expected price 79000, got {data.get('price')}"
        assert len(data.get("variants", [])) == 35, \
            f"Expected 35 variants, got {len(data.get('variants', []))}"
        
        # Verify each variant has sku and name
        for variant in data.get("variants", []):
            assert "sku" in variant, "Variant missing sku"
            assert "name" in variant, "Variant missing name"
            assert variant["sku"].startswith("TRM-004-"), \
                f"Expected sku to start with 'TRM-004-', got '{variant['sku']}'"
        
        # Print first 3 variants as sample
        print(f"Sample variants:")
        for i, variant in enumerate(data.get("variants", [])[:3], 1):
            print(f"  {i}. {variant['sku']} - {variant['name']}")
        
        print_test("GET /api/products/7 returns Oversize Blouse with 35 variants", True, 
                   f"Price: {data['price']}, Variants: {len(data['variants'])}")
        return True
    except AssertionError as e:
        print_test("GET /api/products/7 returns Oversize Blouse with 35 variants", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products/7 returns Oversize Blouse with 35 variants", False, f"Exception: {str(e)}")
        return False

def test_product_detail_8():
    """Test 4: GET /api/products/8 should return Alysa Blouse with 6 variants"""
    print("=" * 80)
    print("TEST 4: GET /api/products/8 - Alysa Blouse with 6 variants")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/8", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Product: {data.get('name')}")
        print(f"Variants count: {len(data.get('variants', []))}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "Alysa Blouse" in data.get("name", ""), \
            f"Expected 'Alysa Blouse' in name, got '{data.get('name')}'"
        assert len(data.get("variants", [])) == 6, \
            f"Expected 6 variants, got {len(data.get('variants', []))}"
        
        # Verify variant names
        expected_variant_names = ["LB. ALYSA", "LB. ERICA", "LB. LAVENDER", "LB. TIARA", "LB. LUNA BLACK", "LB. SASKIA"]
        variant_names = [v["name"] for v in data.get("variants", [])]
        
        for expected_name in expected_variant_names:
            assert expected_name in variant_names, \
                f"Expected variant '{expected_name}' not found in {variant_names}"
        
        print(f"Variant names: {', '.join(variant_names)}")
        
        print_test("GET /api/products/8 returns Alysa Blouse with 6 variants", True, 
                   f"Variants: {len(data['variants'])}, Names: {', '.join(variant_names[:3])}...")
        return True
    except AssertionError as e:
        print_test("GET /api/products/8 returns Alysa Blouse with 6 variants", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products/8 returns Alysa Blouse with 6 variants", False, f"Exception: {str(e)}")
        return False

def test_product_detail_404():
    """Test 5: GET /api/products/999 should return 404"""
    print("=" * 80)
    print("TEST 5: GET /api/products/999 - Should return 404")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/999", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        assert data.get("success") == False, "success should be false"
        
        print_test("GET /api/products/999 returns 404", True, "Product not found as expected")
        return True
    except AssertionError as e:
        print_test("GET /api/products/999 returns 404", False, str(e))
        return False
    except Exception as e:
        print_test("GET /api/products/999 returns 404", False, f"Exception: {str(e)}")
        return False

def test_product_stock():
    """Test 6: Verify product stock is numeric > 0"""
    print("=" * 80)
    print("TEST 6: GET /api/products/1 - Verify stock is numeric > 0")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/products/1", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Stock: {data.get('stock')}")
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "stock" in data, "stock field missing"
        assert isinstance(data["stock"], (int, float)), \
            f"stock should be numeric, got {type(data['stock'])}"
        assert data["stock"] > 0, f"stock should be > 0, got {data['stock']}"
        
        print_test("Product stock is numeric > 0", True, f"Stock: {data['stock']}")
        return True
    except AssertionError as e:
        print_test("Product stock is numeric > 0", False, str(e))
        return False
    except Exception as e:
        print_test("Product stock is numeric > 0", False, f"Exception: {str(e)}")
        return False

def test_full_e2e_regression():
    """Test 7: Full E2E regression with new catalog product"""
    print("=" * 80)
    print("TEST 7: FULL E2E REGRESSION - Checkout with new catalog product")
    print("=" * 80)
    
    try:
        # Step 1: Create checkout session with product ID 7 (Oversize Blouse)
        print("\nStep 1: Create checkout session with product ID 7...")
        payload = {
            "items": [
                {
                    "id": "7",
                    "qty": 2,
                    "name": "Oversize Blouse Motif",
                    "price": 79000,
                    "image": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800"
                }
            ],
            "customer": {
                "name": "Siti Nurhaliza",
                "phone": "081234567890",
                "email": "siti@example.com",
                "address": "Jl Malioboro 123",
                "destination": {
                    "id": "LOCAL-YGY-02",
                    "text": "Gondokusuman, Kota Yogyakarta, DIY"
                }
            },
            "shipping": {
                "service": "jne",
                "service_name": "JNE REG",
                "price": 22000,
                "estimated_days": "2-3"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/checkout/session", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        
        assert resp.status_code == 200, f"Checkout session failed: {resp.status_code}"
        assert data.get("success") == True, "Checkout session failed"
        assert "order" in data, "order key missing"
        
        order = data["order"]
        print(f"✓ Order created: {order['id']}")
        print(f"✓ Grand Total: Rp {order['grandTotal']}")
        
        # Verify grandTotal calculation: (79000 * 2) + 22000 = 180000
        expected_total = (79000 * 2) + 22000
        assert order["grandTotal"] == expected_total, \
            f"Expected grandTotal {expected_total}, got {order['grandTotal']}"
        
        # Step 2: Create payment
        print("\nStep 2: Create QRIS payment...")
        payload = {
            "orderId": order["id"]
        }
        resp = requests.post(f"{BASE_URL}/api/payment/snap", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        
        assert resp.status_code == 200, f"Payment creation failed: {resp.status_code}"
        assert data.get("success") == True, "Payment creation failed"
        assert "redirect_url" in data, "redirect_url key missing"
        assert "paymentId" in data, "paymentId key missing"
        
        # Verify payment details
        assert data["redirect_url"].startswith("https://pay-sandbox.komerce.my.id/"), \
            f"Invalid redirect_url: {data['redirect_url']}"
        assert data["paymentId"].startswith("KPAY-"), \
            f"Invalid paymentId: {data['paymentId']}"
        assert data["amount"] == order["grandTotal"], \
            f"Amount mismatch: {data['amount']} != {order['grandTotal']}"
        
        print(f"✓ Payment created: {data['paymentId']}")
        print(f"✓ Payment URL: {data['redirect_url']}")
        print(f"✓ Amount: Rp {data['amount']}")
        
        print_test("Full E2E regression with new catalog", True, 
                   f"Order {order['id']} → Payment {data['paymentId']} → Rp {data['amount']}")
        return True
    except AssertionError as e:
        print_test("Full E2E regression with new catalog", False, str(e))
        return False
    except Exception as e:
        print_test("Full E2E regression with new catalog", False, f"Exception: {str(e)}")
        return False

def test_catchall_uses_catalog():
    """Test 8: Catch-all endpoint also uses real catalog"""
    print("=" * 80)
    print("TEST 8: GET /api/anything-else - Catch-all should return real catalog")
    print("=" * 80)
    
    try:
        resp = requests.get(f"{BASE_URL}/api/anything-else", timeout=10)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "products" in data or "data" in data, "products or data key missing"
        
        # Get the products array (could be in 'products' or 'data' key)
        products = data.get("products") or data.get("data")
        assert isinstance(products, list), f"Expected array, got {type(products)}"
        assert len(products) == 8, f"Expected 8 products, got {len(products)}"
        
        # Verify it's the real catalog (check for new product names)
        product_names = [p.get("name", "") for p in products]
        assert any("Tunik Rayon Maroon Polos" in name for name in product_names), \
            "Real catalog product 'Tunik Rayon Maroon Polos' not found in catch-all response"
        
        # Verify old dummy products are NOT present
        assert not any("Soraya Blouse Linen Beige" in name for name in product_names), \
            "Old dummy product 'Soraya Blouse Linen Beige' should not be in catch-all response"
        
        print_test("Catch-all endpoint uses real catalog", True, 
                   f"Returns {len(products)} products from real catalog")
        return True
    except AssertionError as e:
        print_test("Catch-all endpoint uses real catalog", False, str(e))
        return False
    except Exception as e:
        print_test("Catch-all endpoint uses real catalog", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "=" * 80)
    print("ROUND 6 BACKEND TEST - REAL PRODUCT CATALOG FROM EXCEL")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print("=" * 80 + "\n")
    
    results = []
    
    # Run all tests
    results.append(("GET /api/products (8 products)", test_products_list()))
    results.append(("GET /api/products/1 (Tunik Rayon)", test_product_detail_1()))
    results.append(("GET /api/products/7 (35 variants)", test_product_detail_7()))
    results.append(("GET /api/products/8 (6 variants)", test_product_detail_8()))
    results.append(("GET /api/products/999 (404)", test_product_detail_404()))
    results.append(("Product stock verification", test_product_stock()))
    results.append(("Full E2E regression", test_full_e2e_regression()))
    results.append(("Catch-all uses catalog", test_catchall_uses_catalog()))
    
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
        print("🎉 ALL TESTS PASSED! Real product catalog working perfectly.")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the failures above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
