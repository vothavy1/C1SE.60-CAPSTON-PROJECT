const API_BASE_URL = 'http://localhost:5000/api';

let currentTestId = null;

function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadTestDetails();
    setupAddQuestionButton();
});

function getTestIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function setupAddQuestionButton() {
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        if (currentTestId) {
            window.location.href = `create-question.html?testId=${currentTestId}`;
        }
    });
}

async function loadTestDetails() {
    currentTestId = getTestIdFromUrl();
    if (!currentTestId) {
        alert('Không tìm thấy ID đề thi!');
        window.location.href = 'test-list.html';
        return;
    }

    try {
        // Lấy thông tin đề thi
        const response = await fetch(`${API_BASE_URL}/tests/${currentTestId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Không lấy được thông tin đề thi!');
        const test = await response.json();
        
        // Hiển thị thông tin đề thi
        document.getElementById('testName').textContent = test.name || 'N/A';
        document.getElementById('testType').textContent = test.type || 'N/A';
        document.getElementById('testDescription').textContent = test.description || 'Không có mô tả';
        
        // Lấy danh sách câu hỏi
        await loadQuestions();
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE_URL}/tests/${currentTestId}/questions`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Không lấy được danh sách câu hỏi!');
        const questions = await response.json();
        renderQuestions(questions);
    } catch (error) {
        console.error(error);
        document.querySelector('#questionsTable tbody').innerHTML = `<tr><td colspan="5" class="text-danger text-center">${error.message}</td></tr>`;
    }
}

function renderQuestions(questions) {
    const tbody = document.querySelector('#questionsTable tbody');
    tbody.innerHTML = '';
    
    if (!Array.isArray(questions) || questions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có câu hỏi nào.</td></tr>';
        return;
    }
    
    questions.forEach((question, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${question.content || question.question_text || 'N/A'}</td>
            <td>${question.type || question.question_type || 'N/A'}</td>
            <td>${question.points || question.score || 0}</td>
            <td>
                <a href="edit-question.html?id=${question.id}&testId=${currentTestId}" class="btn btn-sm btn-primary me-2">Sửa</a>
                <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${question.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteQuestion(questionId) {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Xóa câu hỏi thất bại!');
        
        alert('Xóa câu hỏi thành công!');
        loadQuestions();
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}
