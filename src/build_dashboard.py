#!/usr/bin/env python3
"""Inject data/data.json into src/dashboard_template.html to produce the
single-file interactive dashboard. Run from project root:
    python src/build_dashboard.py
"""
import base64
tpl = open('src/dashboard_template.html', encoding='utf-8').read()
data = open('data/data.json', encoding='utf-8').read()
out = tpl.replace('/*DATA_PLACEHOLDER*/', 'var DATA=' + data + ';')
assert '/*DATA_PLACEHOLDER*/' not in out, "placeholder not replaced"

def _logo_uri(path):
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()
# light logo = dark ink (for white surfaces: report sheet); dark logo = white ink (for dark surfaces: header, master card)
out = out.replace('__LOGO_LIGHT__', _logo_uri('assets/logo-light.png'))
out = out.replace('__LOGO_DARK__', _logo_uri('assets/logo-dark.png'))
dest = 'RERA Market Analysis Dashboard.html'
open(dest, 'w', encoding='utf-8').write(out)
import os
print(f"wrote {dest}: {round(os.path.getsize(dest)/1e6,2)} MB (open in any browser, no internet needed)")
