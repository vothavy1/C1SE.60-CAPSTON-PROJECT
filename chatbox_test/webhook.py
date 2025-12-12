from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os

# === KHỞI TẠO MÁY CHỦ FLASK ===
app = Flask(__name__)
CORS(app)  # Cho phép mọi nguồn (Frontend) gọi vào

# --- CẤU HÌNH QUAN TRỌNG ---
# 1. DÁN API KEY CỦA BẠN VÀO GIỮA DẤU NGOẶC KÉP:
YOUR_API_KEY = "......" 
# ---------------------------

# Cấu hình Gemini
if YOUR_API_KEY:
    genai.configure(api_key=YOUR_API_KEY)
    # Dùng model mà bạn đã test thành công
    model = genai.GenerativeModel('models/gemini-2.5-flash')
else:
    print("⚠️ CẢNH BÁO: Chưa có API Key! Code sẽ bị lỗi khi gọi Gemini.")

def get_gemini_response(user_question):
    try:
        if not YOUR_API_KEY:
            return "Lỗi server: Chưa cấu hình API Key."
            
        prompt = f"Bạn là trợ lý tuyển dụng. Trả lời ngắn gọn dưới 50 từ: {user_question}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Lỗi Gemini: {e}")
        return "Xin lỗi, hệ thống đang bận."

# === ROUTE XỬ LÝ TIN NHẮN (ĐA NĂNG) ===
@app.route('/webhook', methods=['POST'])
def chat_endpoint():
    try:
        data = request.get_json()
        print("\n--- Nhận được dữ liệu ---")
        print(data) # In ra để kiểm tra xem Web gửi cái gì

        user_question = ""
        
        # TRƯỜNG HỢP 1: Xử lý cho Dialogflow (Cấu trúc phức tạp)
        if 'queryResult' in data:
            user_question = data['queryResult']['queryText']
            print(f"-> Nguồn: Dialogflow | Câu hỏi: {user_question}")
            
            gemini_answer = get_gemini_response(user_question)
            return jsonify({
                "fulfillmentMessages": [{"text": {"text": [gemini_answer]}}],
                "fulfillmentText": gemini_answer
            })

        # TRƯỜNG HỢP 2: Xử lý cho Chatbox Web thường (Cấu trúc đơn giản)
        # Web thường gửi: {"message": "hello"} hoặc {"content": "hello"}
        elif 'message' in data or 'content' in data:
            user_question = data.get('message') or data.get('content')
            print(f"-> Nguồn: Web Chat | Câu hỏi: {user_question}")
            
            gemini_answer = get_gemini_response(user_question)
            # Trả về JSON đơn giản cho Web dễ đọc
            return jsonify({"reply": gemini_answer})
            
        else:
            return jsonify({"reply": "Lỗi: Không đọc được tin nhắn. Vui lòng gửi JSON có key là 'message'."})

    except Exception as e:
        print(f"Lỗi Webhook: {e}")
        return jsonify({"reply": "Lỗi hệ thống backend."})

# === CHẠY SERVER ===
if __name__ == '__main__':
    print(f">>> Server đang chạy tại: http://127.0.0.1:5000/webhook")
    print(f">>> Model: models/gemini-2.5-flash")
    app.run(port=5000, debug=True)