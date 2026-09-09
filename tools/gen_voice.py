# 生成页面里所有会朗读的句子的 mp3（微软 Edge 神经网络中文声音，免费、无需 key）
# 用法：ttsenv/bin/python tools/gen_voice.py   （已有的文件会跳过；改了文案再跑一遍即可）
import asyncio, hashlib, json, re, pathlib, sys
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = '\n'.join(f.read_text(encoding='utf-8') for f in sorted((ROOT / 'scenes').glob('*.js')))
OUT = ROOT / 'voice'
VOICES = {'yunxia': 'zh-CN-YunxiaNeural', 'xiaoyi': 'zh-CN-XiaoyiNeural'}
SAMPLE = {'yunxia': '你好，我是云夏，我来给你讲这些东西是怎么动的。', 'xiaoyi': '你好，我是小依，我来给你讲这些东西是怎么动的。'}
RATE = '-8%'

import sys
sys.path.insert(0, str(ROOT / 'tools'))
from check_voice import collect_lines
lines = collect_lines(ROOT)

lines = sorted(lines)
ids = {t: hashlib.md5(t.encode('utf-8')).hexdigest()[:8] for t in lines}
(OUT / 'lines.json').write_text(json.dumps(ids, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(lines)} lines')

sem = asyncio.Semaphore(4)
async def gen(text, voice, path):
    if path.exists() and path.stat().st_size > 0:
        return 'skip'
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate=RATE).save(str(path))
                return 'ok'
            except Exception as e:
                err = e
                await asyncio.sleep(1.5 * (attempt + 1))
        print('FAILED', voice, text, err, file=sys.stderr)
        return 'fail'

async def main():
    jobs = []
    for key, voice in VOICES.items():
        d = OUT / key; d.mkdir(parents=True, exist_ok=True)
        jobs.append(gen(SAMPLE[key], voice, d / 'sample.mp3'))
        for t, i in ids.items():
            jobs.append(gen(t, voice, d / f'{i}.mp3'))
    res = await asyncio.gather(*jobs)
    print({k: res.count(k) for k in set(res)})

asyncio.run(main())
