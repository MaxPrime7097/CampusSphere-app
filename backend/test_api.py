import requests

url = "http://127.0.0.1:8000/api/study/generate/from-upload/"

try:
    with open("test.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")

    with open("test.pdf", "rb") as f:
        files = {
            "file": ("test.pdf", f, "application/pdf")
        }
        data = {
            "tool_types": '["fiche"]'
        }
        response = requests.post(url, files=files, data=data)
        print("Status Code:", response.status_code)
        print("Response:", response.text)
except Exception as e:
    print("Error:", e)
