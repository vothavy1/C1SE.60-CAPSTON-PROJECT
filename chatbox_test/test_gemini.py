import google.generativeai as genai
import os

# 1. Dán lại KEY của bạn vào đây
YOUR_API_KEY = "AIzaSyAihTa6M4CuiHikmwsHDyi1g98tiWw82x8" 

try:
    genai.configure(api_key=YOUR_API_KEY)

    # 2. ĐÃ SỬA: Dùng model 'gemini-2.5-flash' có trong danh sách của bạn
    # Lưu ý: Mình lấy chính xác tên 'models/gemini-2.5-flash' từ danh sách bạn gửi
    model = genai.GenerativeModel('models/gemini-2.5-flash')

    print("--- Đang hỏi Gemini (model 2.5-flash)... ---")
    
    # Gửi câu hỏi test
    response = model.generate_content("Chào Gemini, hãy giới thiệu ngắn gọn về bạn bằng tiếng Việt.")

    print("\n--- Câu trả lời từ Gemini: ---")
    print(response.text)
    print("------------------------------")

except Exception as e:
    print(f"\nLỗi xảy ra: {e}")