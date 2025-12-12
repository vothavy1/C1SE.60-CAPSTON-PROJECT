import requests

# 🔑 Dán API Key của bạn vào đây
YOUR_API_KEY = "......"

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={YOUR_API_KEY}"

try:
    response = requests.get(url)
    response.raise_for_status()

    data = response.json()

    print("=== CÁC MODEL HIỆN ĐANG KHẢ DỤNG ===")
    for model in data.get("models", []):
        name = model.get("name", "Unknown")
        desc = model.get("description", "")
        print(f"- {name}: {desc}")

except requests.exceptions.RequestException as e:
    print("Lỗi khi gọi API:", e)
    print("Phản hồi:", response.text if 'response' in locals() else "Không có phản hồi")
