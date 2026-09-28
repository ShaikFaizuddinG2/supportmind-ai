import re
from datetime import datetime

def format_timestamp(iso_str):
    if not iso_str:
        return 'N/A'
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        return dt.strftime('%b %d, %Y %H:%M')
    except Exception:
        return iso_str

def sanitize_input(text):
    if not text:
        return ''
    return re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', str(text)).strip()
