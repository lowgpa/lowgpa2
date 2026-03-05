import urllib.request
import json
import ssl

url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyD0rm_5wRwqXsSbsvdrDJs12vg0aesRB-4'
data = {'contents': [{'parts': [{'text': 'hi'}]}]}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    import urllib.error
    if isinstance(e, urllib.error.HTTPError):
        print(e.read().decode('utf-8'))
    else:
        print(e)
