#!/usr/bin/env python3
"""
ROUND 8 Backend Testing - Image Upload + Enhanced Product Fields
Tests the new upload endpoint and enhanced product fields (dimensions, variants, sizes, weight, description)
"""

import requests
import json
import os
import time
from io import BytesIO

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://keys-manager.preview.emergentagent.com')
ADMIN_KEY = 'soraya-admin-2026'

def print_test(name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status}: {name}")
    if details:
        print(f"  Details: {details}")
    print()

def test_upload_without_admin_key():
    """Test 1: POST /api/admin/upload without x-admin-key → 403"""
    print("=" * 80)
    print("TEST 1: Upload without admin key")
    print("=" * 80)
    
    try:
        # Create a simple PNG image (1x1 pixel)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', BytesIO(png_data), 'image/png')}
        response = requests.post(f'{BASE_URL}/api/admin/upload', files=files, timeout=10)
        
        passed = response.status_code == 403
        print_test(
            "Upload without admin key returns 403",
            passed,
            f"Status: {response.status_code}, Body: {response.text[:200]}"
        )
        return passed
    except Exception as e:
        print_test("Upload without admin key", False, f"Exception: {str(e)}")
        return False

def test_upload_with_wrong_key():
    """Test 2: POST /api/admin/upload with wrong key → 403"""
    print("=" * 80)
    print("TEST 2: Upload with wrong admin key")
    print("=" * 80)
    
    try:
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', BytesIO(png_data), 'image/png')}
        headers = {'x-admin-key': 'wrong-key-123'}
        response = requests.post(f'{BASE_URL}/api/admin/upload', files=files, headers=headers, timeout=10)
        
        passed = response.status_code == 403
        print_test(
            "Upload with wrong admin key returns 403",
            passed,
            f"Status: {response.status_code}, Body: {response.text[:200]}"
        )
        return passed
    except Exception as e:
        print_test("Upload with wrong admin key", False, f"Exception: {str(e)}")
        return False

def test_upload_valid_image():
    """Test 3: POST /api/admin/upload with valid image → 200 with url, size, type, name + verify file exists"""
    print("=" * 80)
    print("TEST 3: Upload valid image")
    print("=" * 80)
    
    try:
        # Create a simple PNG image
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', BytesIO(png_data), 'image/png')}
        headers = {'x-admin-key': ADMIN_KEY}
        response = requests.post(f'{BASE_URL}/api/admin/upload', files=files, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print_test("Upload valid image", False, f"Status: {response.status_code}, Body: {response.text}")
            return False, None
        
        data = response.json()
        
        # Check response structure
        checks = []
        checks.append(('success' in data and data['success'], "Has success:true"))
        checks.append(('url' in data and data['url'].startswith('/uploads/'), f"Has url starting with /uploads/: {data.get('url', 'N/A')}"))
        checks.append(('size' in data and data['size'] > 0, f"Has size > 0: {data.get('size', 'N/A')}"))
        checks.append(('type' in data and data['type'] == 'image/png', f"Has type image/png: {data.get('type', 'N/A')}"))
        checks.append(('name' in data and len(data['name']) > 0, f"Has name: {data.get('name', 'N/A')}"))
        
        # Verify file exists on disk
        file_path = f"/app/public{data.get('url', '')}"
        file_exists = os.path.exists(file_path)
        checks.append((file_exists, f"File exists on disk at {file_path}"))
        
        # Verify GET /uploads/<name> returns 200
        if data.get('url'):
            try:
                get_response = requests.get(f"{BASE_URL}{data['url']}", timeout=10)
                checks.append((get_response.status_code == 200, f"GET {data['url']} returns 200 (status: {get_response.status_code})"))
            except Exception as e:
                checks.append((False, f"GET {data['url']} failed: {str(e)}"))
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if check[0] else '✗'} {check[1]}" for check in checks])
        
        print_test("Upload valid image", all_passed, details)
        return all_passed, data.get('url')
    except Exception as e:
        print_test("Upload valid image", False, f"Exception: {str(e)}")
        return False, None

def test_upload_text_file():
    """Test 4: POST /api/admin/upload with text file → 400"""
    print("=" * 80)
    print("TEST 4: Upload text file (should reject)")
    print("=" * 80)
    
    try:
        text_data = b'This is a text file, not an image'
        
        files = {'file': ('test.txt', BytesIO(text_data), 'text/plain')}
        headers = {'x-admin-key': ADMIN_KEY}
        response = requests.post(f'{BASE_URL}/api/admin/upload', files=files, headers=headers, timeout=10)
        
        passed = response.status_code == 400
        data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
        
        print_test(
            "Upload text file returns 400",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error', 'N/A')}"
        )
        return passed
    except Exception as e:
        print_test("Upload text file", False, f"Exception: {str(e)}")
        return False

def test_upload_no_file():
    """Test 5: POST /api/admin/upload with no file → 400"""
    print("=" * 80)
    print("TEST 5: Upload with no file field")
    print("=" * 80)
    
    try:
        headers = {'x-admin-key': ADMIN_KEY}
        response = requests.post(f'{BASE_URL}/api/admin/upload', headers=headers, timeout=10)
        
        passed = response.status_code == 400
        data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
        
        print_test(
            "Upload with no file returns 400",
            passed,
            f"Status: {response.status_code}, Error: {data.get('error', 'N/A')}"
        )
        return passed
    except Exception as e:
        print_test("Upload with no file", False, f"Exception: {str(e)}")
        return False

def test_create_product_full_payload():
    """Test 6: POST /api/admin/products with FULL payload including all new fields"""
    print("=" * 80)
    print("TEST 6: Create product with full payload (dimensions, variants, sizes, weight, description)")
    print("=" * 80)
    
    try:
        payload = {
            "name": "Produk Lengkap",
            "price": 150000,
            "category": "Blouse",
            "image": "/uploads/main.jpg",
            "description": "Deskripsi lengkap bahan dan model",
            "sizes": ["S", "M", "L", "XL"],
            "stock": 50,
            "weight": 350,
            "dimensions": {
                "length": 30,
                "width": 25,
                "height": 5
            },
            "variants": [
                {"sku": "V1", "name": "Merah", "image": "/uploads/v1.jpg", "stock": 10},
                {"sku": "V2", "name": "Biru", "image": "/uploads/v2.jpg", "stock": 15}
            ],
            "commissionPct": 15
        }
        
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        response = requests.post(f'{BASE_URL}/api/admin/products', json=payload, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print_test("Create product with full payload", False, f"Status: {response.status_code}, Body: {response.text}")
            return False, None
        
        data = response.json()
        product = data.get('product', {})
        
        # Verify all fields are preserved
        checks = []
        checks.append((product.get('name') == 'Produk Lengkap', f"Name: {product.get('name')}"))
        checks.append((product.get('price') == 150000, f"Price: {product.get('price')}"))
        checks.append((product.get('description') == 'Deskripsi lengkap bahan dan model', f"Description preserved"))
        checks.append((product.get('sizes') == ["S", "M", "L", "XL"], f"Sizes: {product.get('sizes')}"))
        checks.append((product.get('weight') == 350, f"Weight: {product.get('weight')}"))
        checks.append((product.get('commissionPct') == 15, f"CommissionPct: {product.get('commissionPct')}"))
        
        # Check dimensions
        dims = product.get('dimensions', {})
        checks.append((dims.get('length') == 30, f"Dimensions.length: {dims.get('length')}"))
        checks.append((dims.get('width') == 25, f"Dimensions.width: {dims.get('width')}"))
        checks.append((dims.get('height') == 5, f"Dimensions.height: {dims.get('height')}"))
        
        # Check variants
        variants = product.get('variants', [])
        checks.append((len(variants) == 2, f"Variants count: {len(variants)}"))
        if len(variants) >= 2:
            checks.append((variants[0].get('sku') == 'V1' and variants[0].get('name') == 'Merah', f"Variant 1: {variants[0]}"))
            checks.append((variants[1].get('sku') == 'V2' and variants[1].get('name') == 'Biru', f"Variant 2: {variants[1]}"))
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if check[0] else '✗'} {check[1]}" for check in checks])
        
        print_test("Create product with full payload", all_passed, details)
        return all_passed, product.get('id')
    except Exception as e:
        print_test("Create product with full payload", False, f"Exception: {str(e)}")
        return False, None

def test_update_product_dimensions_only(product_id):
    """Test 7: POST /api/admin/products/[id] with ONLY dimensions → verify other fields preserved"""
    print("=" * 80)
    print("TEST 7: Update product with only dimensions (verify other fields preserved)")
    print("=" * 80)
    
    if not product_id:
        print_test("Update product dimensions only", False, "No product ID from previous test")
        return False
    
    try:
        # Update only dimensions
        payload = {
            "dimensions": {
                "length": 40,
                "width": 30,
                "height": 8
            }
        }
        
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        response = requests.post(f'{BASE_URL}/api/admin/products/{product_id}', json=payload, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print_test("Update product dimensions only", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
        
        # Get the product to verify
        get_response = requests.get(f'{BASE_URL}/api/products/{product_id}', timeout=10)
        if get_response.status_code != 200:
            print_test("Update product dimensions only", False, f"Failed to GET product: {get_response.status_code}")
            return False
        
        product = get_response.json()
        
        # Verify dimensions updated and other fields preserved
        checks = []
        dims = product.get('dimensions', {})
        checks.append((dims.get('length') == 40, f"New dimensions.length: {dims.get('length')}"))
        checks.append((dims.get('width') == 30, f"New dimensions.width: {dims.get('width')}"))
        checks.append((dims.get('height') == 8, f"New dimensions.height: {dims.get('height')}"))
        
        # Verify other fields preserved
        checks.append((product.get('name') == 'Produk Lengkap', f"Name preserved: {product.get('name')}"))
        checks.append((product.get('price') == 150000, f"Price preserved: {product.get('price')}"))
        checks.append((product.get('description') == 'Deskripsi lengkap bahan dan model', f"Description preserved"))
        checks.append((len(product.get('variants', [])) == 2, f"Variants preserved: {len(product.get('variants', []))}"))
        checks.append((product.get('sizes') == ["S", "M", "L", "XL"], f"Sizes preserved: {product.get('sizes')}"))
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if check[0] else '✗'} {check[1]}" for check in checks])
        
        print_test("Update product dimensions only", all_passed, details)
        return all_passed
    except Exception as e:
        print_test("Update product dimensions only", False, f"Exception: {str(e)}")
        return False

def test_update_product_clear_variants(product_id):
    """Test 8: POST /api/admin/products/[id] with variants:[] → should clear variants"""
    print("=" * 80)
    print("TEST 8: Update product with empty variants array (should clear)")
    print("=" * 80)
    
    if not product_id:
        print_test("Clear product variants", False, "No product ID from previous test")
        return False
    
    try:
        payload = {"variants": []}
        
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        response = requests.post(f'{BASE_URL}/api/admin/products/{product_id}', json=payload, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print_test("Clear product variants", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
        
        data = response.json()
        product = data.get('product', {})
        
        passed = len(product.get('variants', [])) == 0
        print_test(
            "Clear product variants",
            passed,
            f"Variants after clear: {product.get('variants', [])}"
        )
        return passed
    except Exception as e:
        print_test("Clear product variants", False, f"Exception: {str(e)}")
        return False

def test_update_product_empty_sizes(product_id):
    """Test 9: POST /api/admin/products/[id] with sizes:[] → should default to ["All Size"]"""
    print("=" * 80)
    print("TEST 9: Update product with empty sizes array (should default to ['All Size'])")
    print("=" * 80)
    
    if not product_id:
        print_test("Empty sizes default", False, "No product ID from previous test")
        return False
    
    try:
        payload = {"sizes": []}
        
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        response = requests.post(f'{BASE_URL}/api/admin/products/{product_id}', json=payload, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print_test("Empty sizes default", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
        
        data = response.json()
        product = data.get('product', {})
        
        passed = product.get('sizes') == ["All Size"]
        print_test(
            "Empty sizes default to ['All Size']",
            passed,
            f"Sizes after empty: {product.get('sizes', [])}"
        )
        return passed
    except Exception as e:
        print_test("Empty sizes default", False, f"Exception: {str(e)}")
        return False

def test_regression_products_api():
    """Test 10: REGRESSION - Verify /api/products still returns correct shape"""
    print("=" * 80)
    print("TEST 10: REGRESSION - Verify /api/products shape intact")
    print("=" * 80)
    
    try:
        response = requests.get(f'{BASE_URL}/api/products', timeout=10)
        
        if response.status_code != 200:
            print_test("Products API regression", False, f"Status: {response.status_code}")
            return False
        
        data = response.json()
        
        # Check if response has items, products, and data keys (compatibility shape)
        checks = []
        checks.append(('items' in data and isinstance(data['items'], list), f"Has items array: {len(data.get('items', []))} items"))
        checks.append(('products' in data and isinstance(data['products'], list), f"Has products array: {len(data.get('products', []))} items"))
        checks.append(('data' in data and isinstance(data['data'], list), f"Has data array: {len(data.get('data', []))} items"))
        
        # Check first product has required fields
        items = data.get('items', [])
        if len(items) > 0:
            product = items[0]
            checks.append(('id' in product, "Product has id"))
            checks.append(('name' in product, "Product has name"))
            checks.append(('price' in product and isinstance(product['price'], (int, float)), f"Product has price: {product.get('price')}"))
            checks.append(('image' in product, "Product has image"))
            checks.append(('sizes' in product and isinstance(product['sizes'], list), f"Product has sizes array: {product.get('sizes')}"))
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if check[0] else '✗'} {check[1]}" for check in checks])
        
        print_test("Products API regression", all_passed, details)
        return all_passed
    except Exception as e:
        print_test("Products API regression", False, f"Exception: {str(e)}")
        return False

def test_regression_e2e_checkout():
    """Test 10b: REGRESSION - Verify E2E checkout flow still works"""
    print("=" * 80)
    print("TEST 10b: REGRESSION - E2E checkout flow (session → payment snap → KPAY-xxx)")
    print("=" * 80)
    
    try:
        # Step 1: Create checkout session
        session_payload = {
            "items": [
                {"id": "1", "name": "Test Product", "price": 100000, "qty": 1, "image": "/test.jpg"}
            ],
            "customer": {
                "name": "Budi Santoso",
                "phone": "081234567890",
                "email": "budi@example.com",
                "address": "Jl. Sudirman No. 123, Jakarta Pusat",
                "destination": {
                    "id": "LOCAL-JKT-01",
                    "text": "Jakarta Pusat"
                }
            },
            "shipping": {
                "service": "JNE REG",
                "cost": 15000,
                "estimatedDays": "2-3"
            }
        }
        
        session_response = requests.post(
            f'{BASE_URL}/api/checkout/session',
            json=session_payload,
            timeout=10
        )
        
        if session_response.status_code != 200:
            print_test("E2E checkout regression", False, f"Session creation failed: {session_response.status_code}")
            return False
        
        session_data = session_response.json()
        order_id = session_data.get('order', {}).get('id')
        
        if not order_id:
            print_test("E2E checkout regression", False, "No orderId in session response")
            return False
        
        # Step 2: Create payment snap
        time.sleep(0.5)  # Small delay
        
        snap_payload = {"orderId": order_id}
        snap_response = requests.post(
            f'{BASE_URL}/api/payment/snap',
            json=snap_payload,
            timeout=10
        )
        
        if snap_response.status_code != 200:
            print_test("E2E checkout regression", False, f"Payment snap failed: {snap_response.status_code}, Body: {snap_response.text}")
            return False
        
        snap_data = snap_response.json()
        
        # Verify payment response
        checks = []
        checks.append(('paymentId' in snap_data and snap_data['paymentId'].startswith('KPAY-'), f"PaymentId: {snap_data.get('paymentId', 'N/A')}"))
        checks.append(('redirect_url' in snap_data, f"Has redirect_url: {snap_data.get('redirect_url', 'N/A')[:50]}..."))
        checks.append(('amount' in snap_data, f"Has amount: {snap_data.get('amount', 'N/A')}"))
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if check[0] else '✗'} {check[1]}" for check in checks])
        
        print_test("E2E checkout regression", all_passed, details)
        return all_passed
    except Exception as e:
        print_test("E2E checkout regression", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "=" * 80)
    print("ROUND 8 BACKEND TESTING - Image Upload + Enhanced Product Fields")
    print("=" * 80 + "\n")
    
    results = []
    
    # Test 1-5: Upload endpoint
    results.append(("Upload without admin key", test_upload_without_admin_key()))
    results.append(("Upload with wrong key", test_upload_with_wrong_key()))
    upload_passed, upload_url = test_upload_valid_image()
    results.append(("Upload valid image", upload_passed))
    results.append(("Upload text file (reject)", test_upload_text_file()))
    results.append(("Upload no file (reject)", test_upload_no_file()))
    
    # Test 6-9: Product CRUD with new fields
    create_passed, product_id = test_create_product_full_payload()
    results.append(("Create product with full payload", create_passed))
    results.append(("Update dimensions only", test_update_product_dimensions_only(product_id)))
    results.append(("Clear variants", test_update_product_clear_variants(product_id)))
    results.append(("Empty sizes default", test_update_product_empty_sizes(product_id)))
    
    # Test 10: Regression
    results.append(("Products API regression", test_regression_products_api()))
    results.append(("E2E checkout regression", test_regression_e2e_checkout()))
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == '__main__':
    exit(main())
