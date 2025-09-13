#!/usr/bin/env python3
"""
Generate short numeric activation codes (<= 6 digits) compatible with the backend.

Algorithm:
  - Pick a random 5-digit base (or 3-5 to produce 4-6 total length)
  - Compute check digit = HMAC_SHA256(base, ACTIVATION_SECRET) % 10
  - Final code = base + check

Usage examples:
  - Generate 1000 codes, default length 6: 
      ACTIVATION_SECRET=... python backend/scripts/generate_activation_code.py --count 1000 > codes.txt
  - Generate 5-digit codes (4 base + 1 check):
      ACTIVATION_SECRET=... python backend/scripts/generate_activation_code.py --count 1000 --base-length 4
"""
import os, hmac, hashlib, secrets, argparse

def checksum(base: str, secret: str) -> int:
    mac = hmac.new(secret.encode('utf-8'), base.encode('utf-8'), hashlib.sha256).digest()
    return int.from_bytes(mac[:4], 'big') % 10

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--count', type=int, default=1000)
    ap.add_argument('--base-length', type=int, default=5, help='digits before the check digit (range: 3-5)')
    args = ap.parse_args()

    secret = os.getenv('ACTIVATION_SECRET')
    if not secret:
        raise SystemExit('Set ACTIVATION_SECRET environment variable')

    bl = max(3, min(5, args.base_length))
    out = []
    for _ in range(args.count):
        base = ''.join(str(secrets.randbelow(10)) for _ in range(bl))
        code = f"{base}{checksum(base, secret)}"
        out.append(code)
    print('\n'.join(out))

if __name__ == '__main__':
    main()
