# Security Policy

## Reporting a Vulnerability

We take the security of AbrEnergy seriously. If you discover a security vulnerability, please **do not** open a public issue. Instead, send a private report to:

**Email:** dev@abrenv.com

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Any suggested fix (if known)

### Process

1. You send a report to dev@abrenv.com
2. We acknowledge receipt within 48 hours
3. We investigate and develop a fix
4. We release a patch and notify you
5. You are credited (if you wish) in the release notes

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Current release |
| < 1.0   | ❌ Not supported |

## Security Measures

This project implements:

- **JWT authentication** with token blacklisting on logout
- **Role‑based access control** (5 roles) for all admin endpoints
- **CORS** with whitelisted origins
- **CSRF protection** enabled
- **Secure headers**: `X‑Frame‑Options: DENY`, `X‑Content‑Type‑Options: nosniff`
- **Password validation**: minimum length, common password check
- **Environment‑based secrets** via `python‑decouple`
- **HTTPS‑ready** configuration in production settings

## Dependency Security

Dependencies are monitored for known vulnerabilities. Run the following to check:

```bash
# Backend
pip-audit

# Frontend
npm audit
```
