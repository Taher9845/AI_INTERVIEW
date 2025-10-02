import requests

url = "http://127.0.0.1:8000/api/resume-upload/"
file_path = r"C:\Users\moham\Desktop\Taher_s_Resume-1.pdf"  # raw string

with open(file_path, "rb") as f:
    files = {"resume": f}
    response = requests.post(url, files=files)

print(response.status_code)
print(response.json())