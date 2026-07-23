"""Test customer/register flows"""
import urllib.request, json

BASE = 'http://localhost:8000'

def req(method, path, data=None, token=None):
    h = {'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = 'Bearer ' + token
    b = json.dumps(data).encode() if data else None
    r = urllib.request.urlopen(
        urllib.request.Request(BASE + path, data=b, headers=h, method=method),
        timeout=10
    )
    return r.status, json.loads(r.read())

print('=== CUSTOMER FLOW ===')
s, d = req('POST', '/api/v1/auth/login/', {
    'email': 'customer@abrenv.com', 'password': 'customer123456'
})
print('Login customer:', s)
token = d.get('access', '')

if token:
    s, d = req('GET', '/api/v1/users/me/', token=token)
    print('Profile:', s, '-', d['full_name'], '(', d['role'], ')')

    s, d = req('GET', '/api/v1/calculator/history/', token=token)
    print('Calc history:', s)

    s, d = req('GET', '/api/v1/notifications/', token=token)
    print('Notifications:', s)

print()

print('=== REGISTER NEW USER ===')
s, d = req('POST', '/api/v1/auth/register/', {
    'email': 'new@test.com', 'password': 'test1234',
    'password_confirm': 'test1234', 'full_name': 'New User'
})
print('Register:', s)
if s == 201:
    print('  Created:', d['user']['full_name'])

print()
print('ALL USER FLOWS COMPLETE')
