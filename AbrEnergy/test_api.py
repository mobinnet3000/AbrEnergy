"""AbrEnergy API Integration Test"""
import urllib.request, json, sys

BASE = 'http://localhost:8000'
passed = 0
failed = 0

def test(method, path, data=None, token=None, expect=200):
    global passed, failed
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    try:
        if method == 'GET':
            r = urllib.request.urlopen(url)
        else:
            body = json.dumps(data).encode() if data else None
            req = urllib.request.Request(url, data=body, headers=headers, method=method)
            r = urllib.request.urlopen(req)
        status = r.status
        body = json.loads(r.read())
        if status == expect:
            print(f'  PASS {method} {path} -> {status}')
            passed += 1
        else:
            print(f'  FAIL {method} {path} -> expected {expect}, got {status}')
            failed += 1
        return body
    except Exception as e:
        print(f'  FAIL {method} {path} -> {e}')
        failed += 1
        return None

print('=== PHASE 2: REAL USER FLOW TEST ===')
print()

# --- PUBLIC ---
print('PUBLIC ENDPOINTS:')
test('GET', '/api/v1/site-config/')
test('GET', '/api/v1/services/')
test('GET', '/api/v1/projects/')
test('GET', '/api/v1/articles/')
test('GET', '/api/v1/gallery/')

# Calculator
calc = test('POST', '/api/v1/calculator/off-grid/', {
    'daily_consumption': 30, 'city': 'Tehran',
    'irradiation': 5, 'battery_type': 'lithium', 'system_type': 'off_grid'
})
if calc:
    print(f'    panel_count={calc["result"]["panel_count"]}, roi={calc["result"]["roi_years"]}yrs')

# Contact
test('POST', '/api/v1/contact/', {
    'full_name': 'QA Test', 'email': 'qa@test.com',
    'phone': '09121234567', 'message': 'QA test message',
    'request_type': 'contact'
})

# Project inquiry
test('POST', '/api/v1/project-inquiry/', {
    'name': 'QA Test', 'phone': '09121234567',
    'city': 'Tehran', 'project_type': 'on_grid'
})

print()

# --- AUTH ---
print('AUTH FLOW:')
# Login
login = test('POST', '/api/v1/auth/login/', {
    'email': 'admin@abrenv.com', 'password': 'admin123456'
})
if login:
    token = login.get('access', '')
    print(f'    token={token[:30]}...')
    print(f'    user={login["user"]["full_name"]} ({login["user"]["role"]})')
else:
    token = ''

# Get current user
if token:
    test('GET', '/api/v1/users/me/', token=token)

# Admin dashboard
if token:
    test('GET', '/api/v1/admin/dashboard/stats/', token=token)

# Admin users
if token:
    test('GET', '/api/v1/admin/users/', token=token)

# Admin contacts
if token:
    test('GET', '/api/v1/admin/contact-requests/', token=token)

# Admin activity log
if token:
    test('GET', '/api/v1/admin/activity-log/', token=token)

# Notifications
if token:
    test('GET', '/api/v1/notifications/', token=token)

# Calculator history
if token:
    test('GET', '/api/v1/calculator/history/', token=token)

# Admin calculator history
if token:
    test('GET', '/api/v1/admin/calculator/history/', token=token)

print()
print(f'=== RESULTS: {passed} passed, {failed} failed ===')
if failed > 0:
    sys.exit(1)
