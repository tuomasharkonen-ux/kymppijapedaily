"""Inline every img/*.webp into a single self-contained index.html, so the deck opens anywhere
(double-click, the app's browser pane, email attachment). Edit src.html, then run: python3 build.py"""
import base64, pathlib, re
here = pathlib.Path(__file__).parent
src = (here / "src.html").read_text()
def inline(m):
    data = base64.b64encode((here / m.group(1)).read_bytes()).decode()
    return f'src="data:image/webp;base64,{data}"'
out = re.sub(r'src="(img/[^"]+\.webp)"', inline, src)
(here / "index.html").write_text(out)
print(f"index.html: {len(out) / 1e6:.1f} MB, {out.count('data:image/webp')} images inlined")
