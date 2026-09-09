# 用模板生成各物件页面，并给所有本地脚本加上 ?v=修改时间（改了 js 后手机/浏览器不会拿旧缓存）：python3 tools/build_pages.py
import pathlib,re
ROOT=pathlib.Path(__file__).resolve().parent.parent
TPL=(ROOT/'tools/page-template.html').read_text(encoding='utf-8')
# 配音表同时写一份 js：直接双击 html（file://）时 fetch 拿不到 json，会退回系统机器音
import json
LINES=json.loads((ROOT/'voice/lines.json').read_text(encoding='utf-8'))
(ROOT/'voice/lines.js').write_text('window.VOICE_LINES='+json.dumps(LINES,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
PAGES={'car':'汽车','washer':'洗衣机','elevator':'电梯','excavator':'挖掘机','jet':'飞机','dozer':'推土机'}
def stamp(html):
    def sub(m):
        src=m.group(1).split('?')[0];f=ROOT/src
        return f'src="{src}?v={int(f.stat().st_mtime)}"' if f.exists() else m.group(0)
    return re.sub(r'src="([^"]+\.js)(?:\?v=\d+)?"',sub,html)
for sid,title in PAGES.items():
    (ROOT/f'{sid}.html').write_text(stamp(TPL.replace('__TITLE__',title).replace('__ID__',sid)),encoding='utf-8')
    print('wrote',sid+'.html')
idx=ROOT/'index.html';idx.write_text(stamp(idx.read_text(encoding='utf-8')),encoding='utf-8');print('stamped index.html')
