# 把新场景接进构建和首页：python3 tools/add_scene.py <id> <中文名> <分组>
# 分组：vehicle 交通工具 / site 工程车 / city 市政车 / home 屋里的机器
import sys,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
GROUPS={'vehicle':'交通工具','site':'工程车','city':'市政车','home':'屋里的机器'}

def add(sid,name,group):
    b=ROOT/'tools/build_pages.py';s=b.read_text(encoding='utf-8')
    m=re.search(r"PAGES=\{([^}]*)\}",s)
    if f"'{sid}'" not in m.group(1):
        s=s[:m.end(1)]+f",'{sid}':'{name}'"+s[m.end(1):]
        b.write_text(s,encoding='utf-8')
    i=ROOT/'index.html';s=i.read_text(encoding='utf-8')
    if f'scenes/{sid}.js' not in s:
        s=re.sub(r'(<script src="scenes/car\.js[^"]*"></script>)',
                 f'<script src="scenes/{sid}.js"></script>\n\\1',s,count=1)
    if f'href="{sid}.html"' not in s:
        title=GROUPS[group]
        m2=re.search(r'(<h2>[^<]*<span[^>]*></span>'+title+r'[^<]*<small>[^<]*</small></h2>\s*\n\s*<div class="grid">)',s)
        if not m2:
            m2=re.search(r'(<span class="gi[^"]*"></span>'+title+r' <small>[^<]*</small></h2>\n    <div class="grid">)',s)
        if not m2:
            print(f'  找不到分组「{title}」，请先手动建组');return False
        card=f'\n      <a class="card sky" href="{sid}.html" data-scene="{sid}"><canvas></canvas><div class="nm">{name}</div></a>'
        s=s[:m2.end(1)]+card+s[m2.end(1):]
    i.write_text(s,encoding='utf-8')
    print(f'  + {name} ({sid}) → {GROUPS[group]}')
    return True

if __name__=='__main__':
    add(sys.argv[1],sys.argv[2],sys.argv[3])
