#!/usr/bin/env python3
"""Baut die gehostete Hephaestion-Seite zu EINER Datei: hosted/hephaestion.html"""
import base64, json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'

def module(name, path, imports=''):
    code = (src / path).read_text(encoding='utf-8')
    code = re.sub(r'^import .*?;\s*$', '', code, flags=re.M)
    names = re.findall(r'^export\s+(?:async\s+)?(?:function|const|class|let)\s+([A-Za-z_$][\w$]*)', code, flags=re.M)
    code = re.sub(r'^export\s+', '', code, flags=re.M)
    return f"const {name} = (() => {{\n{imports}\n{code}\nreturn {{ {', '.join(names)} }};\n}})();\n"

js = ''.join([
    module('M_sound', 'sound.js'),
    module('M_orb', 'orb.js'),
    module('M_windows', 'windows.js', 'const { sfx } = M_sound;'),
    module('M_gestures', 'gestures.js'),
    module('M_vu', 'voice-utils.js'),
])
tex = base64.b64encode((root / 'public/textures/earth-night.jpg').read_bytes()).decode()
js += f"const EARTH_TEXTURE = 'data:image/jpeg;base64,{tex}';\n"
js += (root / 'hosted/app.js').read_text(encoding='utf-8')

css = (src / 'styles.css').read_text(encoding='utf-8') + '\n' + (root / 'hosted/hosted.css').read_text(encoding='utf-8')
world = json.dumps(json.loads((root / 'node_modules/world-atlas/countries-110m.json').read_text()), separators=(',', ':'))

html = (root / 'hosted/template.html').read_text(encoding='utf-8')
html = html.replace('/*CSS*/', css).replace('/*WORLD*/', world).replace('/*JS*/', js.replace('</script', '<\\/script'))
out = root / 'hosted/hephaestion.html'
out.write_text(html, encoding='utf-8')
print(f'{out} – {len(html.encode()) / 1024:.0f} KB')
# Vorschau mit demselben Rahmen, den claude.ai beim Veröffentlichen ergänzt (nur zum Testen)
skeleton = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
            '</head><body>' + html + '</body></html>')
(root / 'hosted/preview.html').write_text(skeleton, encoding='utf-8')
