import urllib.request
import json
import ssl

url = 'https://openrouter.ai/api/v1/chat/completions'
data = {
    'model': 'google/gemini-2.0-flash-lite-preview-02-05:free',
    'messages': [{'role': 'user', 'content': 'hi'}]
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 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',
    'HTTP-Referer': 'https://lowgpa.com',
    'X-Title': 'LowGPA Predictor'
})

try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        with open('out_py.txt', 'w', encoding='utf-8') as f:
            f.write(response.read().decode('utf-8'))
except Exception as e:
    import urllib.error
    if isinstance(e, urllib.error.HTTPError):
        with open('out_py.txt', 'w', encoding='utf-8') as f:
            f.write("HTTP ERROR: " + str(e.code) + "\n")
            f.write(e.read().decode('utf-8'))
    else:
        with open('out_py.txt', 'w', encoding='utf-8') as f:
            f.write("OTHER ERROR: " + str(e))
