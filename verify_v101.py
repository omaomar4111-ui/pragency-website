import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

req = urllib.request.Request('https://pragency.pages.dev/', headers=headers)
html = urllib.request.urlopen(req).read().decode('utf-8')

# Remove comments first
html_no_comments = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
visible_portfolio = re.findall(r'<a\s+[^>]*href=["\']/portfolio/?["\'][^>]*>.*?</a>', html_no_comments)
hidden_comments = re.findall(r'<!-- PORTFOLIO_LINK_HIDDEN:.*?-->', html)

print("Visible /portfolio links on homepage:", len(visible_portfolio))
print("Hidden portfolio comments on homepage:", len(hidden_comments))

# Direct access check
req_port = urllib.request.Request('https://pragency.pages.dev/portfolio', headers=headers)
res_port = urllib.request.urlopen(req_port)
print("Direct /portfolio access Status:", res_port.getcode())
