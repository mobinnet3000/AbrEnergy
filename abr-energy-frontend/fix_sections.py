import re

f = r'C:\Users\meck\Documents\abar\abr-energy-frontend\src\app\[locale]\(public)\page.tsx'
with open(f, encoding='utf-8') as fh:
    content = fh.read()

# 1. Remove ProjectCard function (from '/* ===== Project Card' to before 'export default')
content = re.sub(r'/\* ===== Project Card.*?\n\}', '', content, flags=re.DOTALL)

# 2. Remove ArticleCard function  
content = re.sub(r'/\* ===== Article Card.*?\n\}', '', content, flags=re.DOTALL)

# 3. Fix blank lines
content = re.sub(r'\n{3,}', '\n\n', content)

# 4. Replace Projects section
proj_old_start = content.find('{/* ===== 5. FEATURED PROJECTS ===== */}') - 1
proj_old_end = content.find('{/* ===== 6. CALCULATOR CTA ===== */}') - 1
if proj_old_start > 0 and proj_old_end > 0:
    content = content[:proj_old_start] + '\n      {/* ===== 5. FEATURED PROJECTS ===== */}\n      <ProjectsSection />\n\n' + content[proj_old_end:]

# 5. Replace Articles section
art_old_start = content.find('{/* ===== 7. ARTICLES ===== */}') - 1
art_old_end = content.find('{/* ===== 8. CONTACT CTA ===== */}') - 1
if art_old_start > 0 and art_old_end > 0:
    content = content[:art_old_start] + '\n      {/* ===== 7. ARTICLES ===== */}\n      <ArticlesSection />\n\n' + content[art_old_end:]

with open(f, 'w', encoding='utf-8') as fh:
    fh.write(content)

print('Done. Remaining lines:', len(content.split('\n')))
