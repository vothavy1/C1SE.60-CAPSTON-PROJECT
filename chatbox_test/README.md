# HƯỚNG DẪN CHẠY CHATBOT AI (DIALOGFLOW + GEMINI)

Đây là các bước để chạy dự án chatbot. Bạn cần chạy song song 3 thứ:
1.  **Backend (Python):** File `webhook.py`
2.  **Đường hầm (Ngrok):** File `ngrok.exe`
3.  **Giao diện (HTML):** File `test.html`

---

## 1. ⚙️ CÀI ĐẶT (Chỉ làm 1 lần duy nhất)

1.  **Tạo Môi trường ảo:**
    ```bash
    python -m venv venv
    ```
2.  **Kích hoạt Môi trường ảo:**
    ```bash
    .\venv\Scripts\activate
    ```
3.  **Cài đặt thư viện (khi venv đang bật):**
    ```bash
    pip install Flask
    pip install requests
    ```
4.  **Cài đặt Dialogflow:**
    * Tạo Agent (Ngôn ngữ Tiếng Việt).
    * Vào **Intents** -> **Default Fallback Intent**.
    * Kéo xuống **Fulfillment**.
    * **BẬT** "Enable webhook call for this intent".
    * Nhấn **SAVE**.

5.  **Cài đặt Ngrok:**
    * Tải `ngrok.exe` về thư mục `D:\chatBox`.
    * Đăng ký tài khoản `ngrok.com`.
    * Lấy Authtoken.
    * Chạy 1 lần duy nhất (trong Terminal 2):
        ```bash
        .\ngrok.exe config add-authtoken [TOKEN_CỦA_BẠN]
        ```

---

## 2. 🚀 CÁCH CHẠY (Làm mỗi lần sử dụng)

Bạn cần mở 2 cửa sổ Terminal (Powershell) và 1 trình duyệt.

### 💻 Terminal 1: Chạy Backend (Python)

1.  Kích hoạt môi trường ảo:
    ```bash
    .\venv\Scripts\activate
    ```
2.  (Chắc chắn bạn đã dán API Key vào file `webhook.py`!)
3.  Chạy server:
    ```bash
    python webhook.py
    ```
    (Để yên cửa sổ này, nó sẽ báo `Running on http://127.0.0.1:5000`)

### 🌍 Terminal 2: Chạy Đường hầm (Ngrok)

1.  (Không cần `venv`) Chạy Ngrok:
    ```bash
    .\ngrok.exe http 5000
    ```
2.  Nó sẽ hiện ra link **Forwarding**. Hãy **COPY** cái link `https://...` (ví dụ: `https://abcd-1234.ngrok.io`).

### 🔧 Cài đặt (Chỉ làm khi link Ngrok thay đổi)

1.  Quay lại trang **Dialogflow**.
2.  Vào **Fulfillment**.
3.  Trong ô **URL**, **DÁN** cái link `https://...` bạn vừa copy.
4.  **Gõ thêm `/webhook`** vào cuối link. (Ví dụ: `https://abcd-1234.ngrok.io/webhook`)
5.  Kéo xuống và nhấn **SAVE**.

### 🖥️ Trình duyệt: Chạy Giao diện

1.  Mở **VS Code**.
2.  Chuột phải vào file `test.html`.
3.  Chọn **"Open with Live Server"**.
4.  Chat và kiểm tra.