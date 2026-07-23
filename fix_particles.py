"""Fix Math.random in SVG particles"""
path = r'C:\Users\meck\Documents\abar\abr-energy-frontend\src\components\home\AboutSection.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The particles section uses Math.random
old = """{Array.from({ length: 20 }).map((_, i) => {
        const cx = 100 + Math.random() * 300;
        const cy = 100 + Math.random() * 400;
        const r = 1.5 + Math.random() * 2;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#34D399" opacity={0.3 + Math.random() * 0.3}>
            <animate attributeName="cy" values={`${cy};${cy - 30 - Math.random() * 40};${cy}`} dur={`${4 + Math.random() * 4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values={`${0.2 + Math.random() * 0.3};${0.5 + Math.random() * 0.3};${0.2 + Math.random() * 0.3}`} dur={`${3 + Math.random() * 3}s`} repeatCount="indefinite" />
          </circle>
        );
      })}"""

new = """{[20, 45, 78, 110, 135, 160, 190, 215, 240, 265, 290, 320, 345, 370, 395, 420, 450, 475, 500, 530].map((s, i) => {
        const cx = 100 + ((sr(s) * 1000) % 300);
        const cy = 100 + ((sr(s + 50) * 1000) % 400);
        const r = 1.5 + (sr(s + 100) * 1000) % 20 / 10;
        const opacity = 0.2 + (sr(s + 150) * 1000) % 30 / 100;
        const drift = 20 + (sr(s + 200) * 1000) % 40;
        const dur1 = 3 + (sr(s + 250) * 1000) % 4;
        const dur2 = 3 + (sr(s + 300) * 1000) % 3;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#34D399" opacity={opacity}>
            <animate attributeName="cy" values={`${cy};${cy - drift};${cy}`} dur={`${dur1}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values={`${opacity - 0.1};${opacity + 0.15};${opacity - 0.1}`} dur={`${dur2}s`} repeatCount="indefinite" />
          </circle>
        );
      })}"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed particles")
else:
    print("Pattern not found in file")
    # Find the particles section
    import re
    match = re.search(r'\{Array\.from\(\{.*?20.*?\}\).*?<circle.*?</circle>.*?\);\s*\})', content, re.DOTALL)
    if match:
        print("Found section:", match.group()[:200])
