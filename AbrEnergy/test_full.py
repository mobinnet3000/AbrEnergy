"""Full integration test"""
import urllib.request, json, sys

BASE = 'http://localhost:8000'
passed = 0
failed = 0

def test(method, path, data=None, token=None):
    global passed, failed
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
        r = urllib.request.urlopen(req, timeout=10)
        print(f'  PASS {path} ({r.status})')
        passed += 1
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f'  FAIL {path} -> {e.code} {e.reason}')
        failed += 1
    except Exception as e:
        print(f'  FAIL {path} -> {e}')
        failed += 1
    return None, None

print('=== PUBLIC ENDPOINTS ===')
test('GET', '/api/v1/site-config/')
test('GET', '/api/v1/services/')
test('GET', '/api/v1/projects/')
test('GET', '/api/v1/articles/')

print()
print('=== AUTH ===')
status, d = test('POST', '/api/v1/auth/login/', {'email': 'admin@abrenv.com', 'password': 'admin123456'})
token = d.get('access', '') if d else ''

print()
print('=== ADMIN AUTHENTICATED ===')
if token:
    test('GET', '/api/v1/admin/dashboard/stats/', token=token)
    test('GET', '/api/v1/admin/users/', token=token)

print()
print(f'=== RESULTS: {passed} passed, {failed} failed ===')
if failed > 0:
    sys.exit(1)
