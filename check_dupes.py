"""Find duplicate keys in ScrollReveal variants"""
import re

with open(r'C:\Users\meck\Documents\abar\abr-energy-frontend\src\components\home\ScrollReveal.tsx', encoding='utf-8') as f:
    lines = f.readlines()

seen = {}
for i, line in enumerate(lines):
    m = re.match(r"^\s+'(\w+)':\s*\{", line)
    if m:
        key = m.group(1)
        if key in seen:
            print(f"DUPLICATE '{key}' at line {i+1}, first seen at line {seen[key]}")
        else:
            seen[key] = i + 1

print("Keys found:", list(seen.keys()))
