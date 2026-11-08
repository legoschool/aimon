# -*- coding: utf-8 -*-
"""선생님용 압축 파일 만들기

    python tools/make-share-zip.py

exports/aimon-teacher-YYYY-MM-DD.zip 을 만든다(exports 는 .gitignore 대상).
- 게임 파일(index.html, style.css, src/, data/)과 LICENSE.md 를 담는다.
- 선생님이 읽을 문서(md)는 더블클릭으로 열리게 html 로 바꿔 담는다.
- 구글시트연동.md 의 첫 javascript 코드 덩어리를 시트창구_Code.gs 로 뽑는다.
- 검사 도구, 목업, 작업기록, 인수인계서, 에이전트 지침은 담지 않는다.
- 압축 안의 data/config.js 는 MY_SHEET_ENDPOINT 가 빈 값인지 확인한다(아니면 멈춘다).
"""
import datetime
import html
import io
import re
import sys
import zipfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "exports"
TOP = "aimon"  # 압축을 풀면 생기는 폴더 이름

GAME_FILES = ["index.html", "style.css", "LICENSE.md"]
GAME_DIRS = ["src", "data"]
SKIP_NAMES = {"Thumbs.db", "desktop.ini", ".DS_Store"}

# (원본 md, 압축 안 html 이름, 쪽 제목, README 에서 뽑을 절 제목 목록 또는 None)
DOCS = [
    ("사본으로_가져가기.md", "사본으로_가져가기.html", "AI몬스터 사본으로 가져가기", None),
    ("수업활용안내.md", "수업활용안내.html", "AI몬스터 수업 활용 안내", None),
    ("문항표.md", "문항표.html", "AI몬스터 문항표", None),
    ("구글시트연동.md", "구글시트연동.html", "AI몬스터 구글 시트에 기록 모으기", None),
    ("README.md", "고칠곳_안내.html", "AI몬스터 고칠 곳 안내",
     ["고칠 곳", "학년이 바뀌면", "게임이 안 열리는 날", "저작권"]),
]

# md 안의 링크를 압축 안 파일 이름으로 바꾼다
LINK_MAP = {d[0]: d[1] for d in DOCS}
LINK_MAP["README.md"] = "고칠곳_안내.html"

CSS = """
:root{--bg:#fbfaf7;--ink:#1f2328;--muted:#5b6470;--line:#d8dde3;--code:#f1f3f5;--accent:#0b63c5}
@media (prefers-color-scheme: dark){:root{--bg:#16181c;--ink:#e6e8eb;--muted:#a2a9b3;--line:#363b42;--code:#22262c;--accent:#6aa9ff}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.75 "Malgun Gothic","Apple SD Gothic Neo",sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px 80px}
h1{font-size:1.9em;line-height:1.3;margin:.2em 0 .8em}
h2{font-size:1.4em;margin:2em 0 .6em;padding-top:.6em;border-top:1px solid var(--line)}
h3{font-size:1.15em;margin:1.6em 0 .4em}
a{color:var(--accent)}
table{border-collapse:collapse;width:100%;margin:1em 0;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--code)}
code{background:var(--code);padding:1px 5px;border-radius:4px;font:15px Consolas,monospace}
pre{background:var(--code);padding:14px;border-radius:8px;overflow-x:auto}
pre code{padding:0;background:none}
blockquote{margin:1em 0;padding:.4em 1em;border-left:4px solid var(--accent);color:var(--muted)}
hr{border:0;border-top:1px solid var(--line);margin:2em 0}
.top{font-size:.9em;color:var(--muted);margin-bottom:1em}
@media print{body{background:#fff;color:#000;font-size:12pt}.top{display:none}a{color:#000}}
"""


def pick_sections(text, titles):
    """README 에서 원하는 '## 제목' 절만 뽑는다."""
    parts = re.split(r"(?m)^(?=## )", text)
    keep = []
    for p in parts:
        m = re.match(r"## (.+)", p)
        if m and m.group(1).strip() in titles:
            keep.append(p.rstrip().rstrip("-").rstrip())
    return "\n\n".join(keep)


def fix_links(md_text):
    def repl(m):
        label, target = m.group(1), m.group(2)
        base = target.split("#")[0]
        if base in LINK_MAP:
            target = target.replace(base, LINK_MAP[base], 1)
            if label == base:  # 링크 글자가 파일 이름이면 .md 를 떼어 보여 준다
                label = Path(LINK_MAP[base]).stem.replace("_", " ")
        return "[%s](%s)" % (label, target)

    def autolink(chunk):
        # 맨 주소를 누를 수 있게 한다(인라인 코드 `...` 안은 건드리지 않는다)
        pieces = re.split(r"(`[^`]*`)", chunk)
        for i in range(0, len(pieces), 2):
            pieces[i] = re.sub(r"(?<![(<\[\"'])\bhttps?://[^\s)<>`]+[^\s)<>`.,]",
                               lambda u: "<%s>" % u.group(0), pieces[i])
        return "".join(pieces)

    out = []
    # 코드 덩어리(```) 바깥만 고친다
    for j, part in enumerate(re.split(r"(?ms)(^```.*?^```)", md_text)):
        if j % 2:
            out.append(part)
        else:
            part = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", repl, part)
            out.append(autolink(part))
    return "".join(out)


def to_html(md_text, title):
    body = markdown.markdown(fix_links(md_text), extensions=["tables", "fenced_code"])
    return (
        "<!doctype html>\n<html lang=\"ko\"><head><meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        "<title>%s</title><style>%s</style></head><body><main>"
        "<p class=\"top\"><a href=\"사본으로_가져가기.html\">사본으로 가져가기</a> · "
        "<a href=\"index.html\">게임 열기</a></p>\n%s\n</main></body></html>\n"
    ) % (html.escape(title), CSS, body)


def extract_code_gs(md_text):
    m = re.search(r"```javascript\n(.*?)```", md_text, re.S)
    if not m:
        sys.exit("구글시트연동.md 에서 javascript 코드 덩어리를 찾지 못했습니다.")
    return "// AI몬스터 시트 창구 코드. 구글시트연동.md 2단계와 같은 내용입니다.\n" + m.group(1)


def main():
    config = (ROOT / "data" / "config.js").read_text(encoding="utf-8")
    if not re.search(r'const MY_SHEET_ENDPOINT = "";', config):
        sys.exit("data/config.js 의 MY_SHEET_ENDPOINT 가 비어 있지 않습니다. 비운 뒤 다시 만드세요.")

    today = datetime.date.today().isoformat()
    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / ("aimon-teacher-%s.zip" % today)

    buf = io.BytesIO()
    count = 0
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name in GAME_FILES:
            z.write(ROOT / name, "%s/%s" % (TOP, name))
            count += 1
        for d in GAME_DIRS:
            for f in sorted((ROOT / d).rglob("*")):
                if f.is_file() and f.name not in SKIP_NAMES:
                    z.write(f, "%s/%s" % (TOP, f.relative_to(ROOT).as_posix()))
                    count += 1
        for src, dst, title, sections in DOCS:
            text = (ROOT / src).read_text(encoding="utf-8")
            if sections:
                text = "# %s\n\n%s" % (title, pick_sections(text, sections))
            z.writestr("%s/%s" % (TOP, dst), to_html(text, title))
            count += 1
        gs = extract_code_gs((ROOT / "구글시트연동.md").read_text(encoding="utf-8"))
        z.writestr("%s/시트창구_Code.gs" % TOP, gs)
        count += 1

    out.write_bytes(buf.getvalue())
    print("만들었습니다: %s (파일 %d개, %.0f KB)" % (out, count, out.stat().st_size / 1024))


if __name__ == "__main__":
    main()
