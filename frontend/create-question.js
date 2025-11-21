document.getElementById('questionType').addEventListener('change', function() {
    const type = this.value;
    document.getElementById('answerOptions').style.display = (type === 'MULTIPLE_CHOICE') ? '' : 'none';
    document.getElementById('correctAnswerContainer').style.display = (type !== '') ? '' : 'none';
});

function addOption() {
    const container = document.getElementById('optionsContainer');
    const idx = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `<span class="input-group-text">${idx}</span>
        <input type="text" class="form-control" name="optionText" required>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Xóa</button>`;
    container.appendChild(div);
}


// Lấy danh sách đề thi và render vào dropdown
async function loadTestTitles() {
    try {
        const response = await fetch('http://localhost:5000/api/tests', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error('Không lấy được danh sách đề thi');
        const result = await response.json();
        const tests = result.data && result.data.tests ? result.data.tests : [];
        const select = document.getElementById('questionTitle');
        select.innerHTML = '<option value="">-- Chọn đề thi --</option>';
        tests.forEach(test => {
            const option = document.createElement('option');
            option.value = test.test_name || test.name;
            option.textContent = test.test_name || test.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', loadTestTitles);

let isSubmitting = false;
document.getElementById('createQuestionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    // Lấy dữ liệu form
    const questionTitle = document.getElementById('questionTitle').value;
    const questionText = document.getElementById('questionText').value.trim();
    const questionType = document.getElementById('questionType').value;
    let difficultyLevel = document.getElementById('difficultyLevel').value.trim().toLowerCase();
    const correctAnswer = document.getElementById('correctAnswer').value.trim();
    // Normalize difficulty level to backend enum format (EASY, MEDIUM, HARD, EXPERT)
    const difficultyMap = {
        'easy': 'EASY',
        'medium': 'MEDIUM',
        'hard': 'HARD',
        'dễ': 'EASY',
        'trung bình': 'MEDIUM',
        'khó': 'HARD'
    };
    difficultyLevel = difficultyMap[difficultyLevel] || difficultyLevel;
    let options = [];
    let coding_template = undefined;
    // MULTIPLE_CHOICE: collect options
    if (questionType === 'MULTIPLE_CHOICE') {
        const optionInputs = Array.from(document.getElementsByName('optionText'));
        const optionValues = optionInputs.map(input => input.value.trim()).filter(opt => opt !== "");
        options = optionValues.map((optionText, index) => ({
            option_text: optionText,
            is_correct: optionText === correctAnswer
        }));
        // Ensure at least one correct answer
        if (!options.some(opt => opt.is_correct) && options.length > 0) {
            options[0].is_correct = true;
        }
    }
    // SINGLE_CHOICE: only one correct answer
    if (questionType === 'SINGLE_CHOICE') {
        options = [{ option_text: correctAnswer, is_correct: true }];
    }
    // CODING: collect coding template fields (add UI for these if needed)
    if (questionType === 'CODING') {
        // Example: get from hidden fields or prompt
        coding_template = {
            programming_language: 'javascript', // TODO: get from UI
            code_template: '', // TODO: get from UI
            test_cases: '' // TODO: get from UI
        };
    }
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập lại!');
        window.location.href = 'login.html';
        isSubmitting = false;
        return;
    }
    // Gửi dữ liệu lên backend qua API
    try {
        // You may need to get category_id from UI if required by backend
        const data = {
            question_title: questionTitle, // Tên đề thi lấy từ dropdown
            question_text: questionText,
            question_type: questionType,
            difficulty_level: difficultyLevel,
            options: options,
            coding_template: coding_template
        };
        console.log("Payload:", data);
        const response = await fetch('http://localhost:5000/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert('Đã lưu câu hỏi thành công!');
            history.back();
        } else if (response.status === 401) {
            // Token hết hạn
            alert('Vui lòng đăng nhập lại!');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            const error = await response.text();
            alert('Lỗi khi lưu câu hỏi: ' + error);
        }
    } catch (err) {
        alert('Lỗi khi gửi yêu cầu: ' + err.message);
    }
    isSubmitting = false;
});
