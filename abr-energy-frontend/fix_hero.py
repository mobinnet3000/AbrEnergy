f = r'C:\Users\meck\Documents\abar\abr-energy-frontend\src\components\home\HeroSection.tsx'
with open(f) as fh:
    c = fh.read()

# Remove the duplicate "Calculate Solar System" link (the one without active:scale)
# Keep the one WITH active:scale and the projects link
old = (
    '            </Link>\n'
    '            <Link href="/calculator" className="group relative inline-flex items-center justify-center px-9 py-4 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-500">\n'
    '              <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 transition-all duration-500" />\n'
    '              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />\n'
    '              <span className="relative z-10 flex items-center gap-2.5 text-white">\n'
    '                Calculate Solar System <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />\n'
    '              </span>\n'
    '            </Link>\n'
)

# Find and remove the old (non-activeScale) version
idx = c.find(old)
if idx >= 0:
    c = c[:idx] + c[idx + len(old):]
    with open(f, 'w') as fh:
        fh.write(c)
    print('Removed duplicate link')
else:
    print('Pattern not found — checking file')
    # Print area around first calculator link
    idx = c.find('Calculate Solar System')
    print(c[idx-100:idx+200])
