# 配音体检：页面会念的每一句，是不是都有两个声音的 mp3？
#   python3 tools/check_voice.py
# 漏一句，页面念到那里就会退回系统机器音，而且不报错、很难发现。
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICES = ['yunxia', 'xiaoyi']


def defpart_blocks(src):
    r"""按花括号配对切出每个 defPart 的定义块。
    不能用正则找结尾——以前拿 `\},\[` 当结尾，遇到 `},pipes)` 这种写法整条漏掉。"""
    out, i = [], 0
    while True:
        i = src.find("defPart(", i)
        if i < 0:
            break
        j = src.find("{", i)
        if j < 0:
            break
        depth, k, n, instr = 0, j, len(src), None
        while k < n:
            c = src[k]
            if instr:
                if c == "\\":
                    k += 2
                    continue
                if c == instr:
                    instr = None
            elif c in "'\"`":
                instr = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    out.append(src[j:k + 1])
                    break
            k += 1
        i = j + 1
    return out


def collect_lines(root=ROOT):
    """页面实际会朗读的全部句子。要和 app.js 里 say() 的拼法一致。"""
    src = '\n'.join(f.read_text(encoding='utf-8')
                    for f in sorted((root / 'scenes').glob('*.js')))
    lines = set()
    for blk in defpart_blocks(src):
        m = re.search(r"name:'([^']+)'", blk)
        if not m:
            continue
        for t in re.findall(r"\btext2?:'([^']+)'", blk):
            lines.add(f"{m.group(1)}。{t}")
    for m in re.finditer(r"\{t:'([^']+)'\s*,", src):
        lines.add(m.group(1))
    for m in re.finditer(r"stopSaid:'([^']+)'", src):
        lines.add(m.group(1))
    lines.update(['看里面', '合上', '拆开看', '装回去'])
    return lines


def main():
    lines = collect_lines()
    lj = ROOT / 'voice/lines.json'
    if not lj.exists():
        print('✗ voice/lines.json 不存在，先跑 tools/gen_voice.py')
        return 1
    L = json.loads(lj.read_text(encoding='utf-8'))
    bad = 0

    missing = sorted(lines - set(L))
    stale = sorted(set(L) - lines)
    print(f'场景里会念的句子 {len(lines)} 条，lines.json {len(L)} 条')
    if missing:
        bad = 1
        print(f'✗ 有 {len(missing)} 句没有配音（会退回系统机器音）：')
        for t in missing[:10]:
            print('   ', t[:50])
    if stale:
        print(f'· lines.json 里有 {len(stale)} 条已经没人念了（可以清）')

    want = {L[t] for t in lines if t in L} | {'sample'}
    for v in VOICES:
        d = ROOT / 'voice' / v
        have = {f.stem: f for f in d.glob('*.mp3')} if d.exists() else {}
        miss = want - set(have)
        tiny = [k for k in want & set(have) if have[k].stat().st_size < 1500]
        orphan = set(have) - want
        flag = '✗' if (miss or tiny) else '✓'
        if miss or tiny:
            bad = 1
        print(f'{flag} {v}: {len(have)} 个文件，缺 {len(miss)}，空/截断 {len(tiny)}，多余 {len(orphan)}')
        for k in list(miss)[:5]:
            print('    缺:', k)

    print('全部通过' if not bad else '有问题，跑 tools/gen_voice.py 补齐')
    return bad


if __name__ == '__main__':
    sys.exit(main())
