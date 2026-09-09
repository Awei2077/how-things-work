# 配音说明

这里的 mp3 由 [edge-tts](https://github.com/rany2/edge-tts) 调用微软 Edge 的
朗读服务生成，两套声音：

- `yunxia/` —— zh-CN-YunxiaNeural（云夏，男童声）
- `xiaoyi/` —— zh-CN-XiaoyiNeural（小依，女童声）

`lines.json` 是「文案 → 文件名」的对照表，文件名是文案的 md5 前 8 位。
`lines.js` 是同一张表的 `<script>` 版本，给 `file://` 直接打开时用
（那种情况下 `fetch` 会被浏览器拦掉）。

## 改了文案怎么办

```bash
pip install edge-tts
python3 tools/gen_voice.py      # 只补新增的句子，已有的自动跳过
python3 tools/check_voice.py    # 核对有没有漏
python3 tools/build_pages.py    # 刷新 lines.js
```

## 关于这些音频

音频是用微软 Edge 的免费朗读服务生成的，随本项目一起提供只是为了让人
下载下来就能听。如果你要拿去做别的用途，建议自己重新生成一份，或者换成
其它 TTS——`tools/gen_voice.py` 里改一下 `VOICES` 就行。

页面右上角可以在「云夏 / 小依 / 系统」之间切换，选「系统」用的是浏览器
自带的朗读，不依赖这里的任何文件。
