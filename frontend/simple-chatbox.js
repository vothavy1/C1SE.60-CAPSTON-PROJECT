// Simple Chatbox without Dialogflow
class SimpleChatbox {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createChatboxHTML();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    createChatboxHTML() {
        const chatboxHTML = `
            <div id="simple-chatbox-toggle" class="chatbox-toggle">
                💬
            </div>
            
            <div id="simple-chatbox" class="simple-chatbox hidden">
                <div class="chatbox-header">
                    <h4>ChatBox AI</h4>
                    <button id="chatbox-close">✕</button>
                </div>
                <div id="chatbox-messages" class="chatbox-messages">
                </div>
                <div class="chatbox-input">
                    <input type="text" id="chatbox-input" placeholder="Nhập tin nhắn..." />
                    <button id="chatbox-send">Gửi</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatboxHTML);
    }

    bindEvents() {
        document.getElementById('simple-chatbox-toggle').onclick = () => this.toggleChat();
        document.getElementById('chatbox-close').onclick = () => this.toggleChat();
        document.getElementById('chatbox-send').onclick = () => this.sendMessage();
        document.getElementById('chatbox-input').onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };
    }

    toggleChat() {
        const chatbox = document.getElementById('simple-chatbox');
        const toggle = document.getElementById('simple-chatbox-toggle');
        
        if (this.isOpen) {
            chatbox.classList.add('hidden');
            toggle.style.display = 'block';
            this.isOpen = false;
        } else {
            chatbox.classList.remove('hidden');
            toggle.style.display = 'none';
            this.isOpen = true;
        }
    }

    addMessage(message, isUser = false) {
        const messagesDiv = document.getElementById('chatbox-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = message;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    addWelcomeMessage() {
        this.addMessage('Xin chào! Tôi có thể hỗ trợ bạn về việc ứng tuyển. Bạn cần giúp đỡ gì?');
    }

    async sendMessage() {
        const input = document.getElementById('chatbox-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessage(message, true);
        input.value = '';
        
        // Show typing indicator
        this.addMessage('Đang trả lời...');
        
        try {
            // Call local API
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Remove typing indicator
                const messages = document.getElementById('chatbox-messages');
                messages.removeChild(messages.lastChild);
                this.addMessage(data.reply);
            } else {
                throw new Error('API Error');
            }
        } catch (error) {
            // Remove typing indicator and show local response
            const messages = document.getElementById('chatbox-messages');
            messages.removeChild(messages.lastChild);
            this.addMessage(this.getLocalResponse(message));
        }
    }

    getLocalResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('cv') || lowerMessage.includes('hồ sơ')) {
            return 'Bạn có thể upload CV dưới dạng PDF, DOC hoặc DOCX. Kích thước tối đa là 5MB. Hãy đảm bảo CV của bạn có đầy đủ thông tin liên lạc!';
        } else if (lowerMessage.includes('email') || lowerMessage.includes('gmail')) {
            return 'Email phải có định dạng @gmail.com. Ví dụ: user123@gmail.com. Đây sẽ là kênh liên lạc chính của chúng tôi với bạn.';
        } else if (lowerMessage.includes('kinh nghiệm') || lowerMessage.includes('năm')) {
            return 'Hãy nhập số năm kinh nghiệm chính xác. Nếu bạn mới tốt nghiệp, hãy nhập 0. Chúng tôi cũng có các vị trí dành cho người mới bắt đầu!';
        } else if (lowerMessage.includes('công ty') || lowerMessage.includes('apply')) {
            return 'Bạn có thể chọn công ty muốn ứng tuyển từ danh sách dropdown. Nếu không thấy công ty mong muốn, hãy để lại thông tin và chúng tôi sẽ liên hệ!';
        } else if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Xin chào! Tôi rất vui được hỗ trợ bạn trong quá trình ứng tuyển. Bạn có câu hỏi gì về việc điền form ứng tuyển không?';
        } else if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank')) {
            return 'Rất vui được hỗ trợ bạn! Chúc bạn thành công trong quá trình ứng tuyển. Nếu cần thêm hỗ trợ, đừng ngần ngại nhắn tin!';
        } else if (lowerMessage.includes('lỗi') || lowerMessage.includes('error') || lowerMessage.includes('không gửi được')) {
            return 'Nếu gặp lỗi khi gửi form, hãy kiểm tra: 1) Email đúng định dạng @gmail.com 2) Số điện thoại chỉ chứa số 3) Đã chọn file CV 4) Kết nối internet ổn định.';
        } else {
            return 'Tôi hiểu bạn đang cần hỗ trợ về ứng tuyển. Bạn có thể hỏi về: CV, email, kinh nghiệm, công ty, hoặc bất kỳ vấn đề gì khác trong quá trình ứng tuyển!';
        }
    }
}

// Initialize chatbox when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SimpleChatbox();
});