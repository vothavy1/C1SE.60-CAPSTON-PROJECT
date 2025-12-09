import google.generativeai as genai

# DÁN KEY CỦA BẠN VÀO ĐÂY
YOUR_API_KEY = "...."
genai.configure(api_key=YOUR_API_KEY)

print("--- Đang lấy danh sách các Model có thể dùng... ---")
try:
    count = 0
    for m in genai.list_models():
        # Chỉ lấy những model hỗ trợ chat/tạo nội dung
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            count += 1
    
    if count == 0:
        print("KHÔNG TÌM THẤY MODEL NÀO! Có thể do API Key chưa kích hoạt Google AI Studio.")
    else:
        print(f"\n=> Tìm thấy {count} model. Hãy chọn 1 cái tên ở trên để thay vào code.")

except Exception as e:
    print(f"Lỗi khi lấy danh sách: {e}")