const API_BASE_URL = 'http://localhost:5000/api';
let questionId = null;
let optionCounter = 0;

// Get question ID from URL
function getQuestionIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Show/Hide loading
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// Load categories
async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('📂 Loading categories...');
        
        const response = await fetch(`${API_BASE_URL}/questions/categories/all`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📂 Categories response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Categories loaded:', data.data?.length || 0);
            
            const select = document.getElementById('categoryId');
            
            if (data.data && data.data.length > 0) {
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.category_id;
                    option.textContent = category.category_name;
                    select.appendChild(option);
                });
            } else {
                console.warn('⚠️ No categories found');
            }
        } else {
            console.error('❌ Failed to load categories:', response.status);
            // Don't block the page if categories fail to load
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        // Don't block the page if categories fail to load
    }
}

// Load question data
async function loadQuestion() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
        return;
    }

    showLoading(true);

    try {
        console.log(`📥 Loading question ID: ${questionId}`);
        
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error response:', errorData);
            
            if (response.status === 403) {
                // Show detailed company mismatch error
                if (errorData.error_code === 'WRONG_COMPANY') {
                    const msg = `⛔ KHÔNG CÓ QUYỀN TRUY CẬP\n\n${errorData.message}\n\n` +
                                `📌 Chi tiết:\n` +
                                `   • Câu hỏi thuộc: Company ID ${errorData.details?.question_company}\n` +
                                `   • Bạn thuộc: Company ID ${errorData.details?.user_company}\n\n` +
                                `💡 Bạn chỉ có thể sửa câu hỏi của công ty mình!`;
                    throw new Error(msg);
                }
                throw new Error(errorData.message || 'Bạn không có quyền chỉnh sửa câu hỏi này');
            } else if (response.status === 404) {
                throw new Error('Không tìm thấy câu hỏi');
            } else {
                throw new Error(errorData.message || 'Không thể tải thông tin câu hỏi');
            }
        }

        const data = await response.json();
        console.log('✅ Question data loaded:', data);
        const question = data.data;

        // Fill form data
        document.getElementById('questionTitle').value = question.question_title || '';
        document.getElementById('questionText').value = question.question_text || '';
        document.getElementById('questionType').value = question.question_type || '';
        document.getElementById('difficultyLevel').value = question.difficulty_level || '';
        document.getElementById('categoryId').value = question.category_id || '';

        // Handle question type change
        handleQuestionTypeChange();

        // Load options if available
        if (question.QuestionOptions && question.QuestionOptions.length > 0) {
            question.QuestionOptions.forEach((option, index) => {
                addOption(option.option_text, option.is_correct, option.option_id);
            });
        } else if (question.question_type === 'SINGLE_CHOICE' || question.question_type === 'MULTIPLE_CHOICE') {
            // Add 4 empty options for multiple choice
            for (let i = 0; i < 4; i++) {
                addOption('', false);
            }
        }

        showLoading(false);
    } catch (error) {
        console.error('❌ Error loading question:', error);
        showLoading(false);
        
        // Show detailed error message
        const errorMsg = `❌ KHÔNG THỂ TẢI CÂU HỎI\n\n${error.message}\n\nBạn sẽ được chuyển về danh sách câu hỏi.`;
        alert(errorMsg);
        
        // Redirect after 1 second
        setTimeout(() => {
            window.location.href = 'question-list.html';
        }, 1000);
    }
}

// Handle question type change
function handleQuestionTypeChange() {
    const questionType = document.getElementById('questionType').value;
    const optionsContainer = document.getElementById('optionsContainer');
    const optionsList = document.getElementById('optionsList');

    if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
        optionsContainer.style.display = 'block';
        
        // If no options, add default 4 options
        if (optionsList.children.length === 0) {
            for (let i = 0; i < 4; i++) {
                addOption('', false);
            }
        }
    } else {
        optionsContainer.style.display = 'none';
    }
}

// Add option
function addOption(text = '', isCorrect = false, optionId = null) {
    const optionsList = document.getElementById('optionsList');
    const questionType = document.getElementById('questionType').value;
    const inputType = questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox';
    
    optionCounter++;
    const optionDiv = document.createElement('div');
    optionDiv.className = `option-row ${isCorrect ? 'correct' : ''}`;
    optionDiv.dataset.optionId = optionId || '';
    optionDiv.id = `option-${optionCounter}`;
    
    optionDiv.innerHTML = `
        <div class="row align-items-center">
            <div class="col-1 text-center">
                <strong class="option-label">${String.fromCharCode(65 + optionsList.children.length)}.</strong>
            </div>
            <div class="col-8">
                <input type="text" class="form-control option-text" 
                       placeholder="Nhập nội dung đáp án" 
                       value="${text}" required>
            </div>
            <div class="col-2 text-center">
                <div class="form-check">
                    <input class="form-check-input" type="${inputType}" 
                           name="correctAnswer" 
                           id="correct-${optionCounter}"
                           ${isCorrect ? 'checked' : ''}
                           onchange="updateCorrectAnswer(this)">
                    <label class="form-check-label" for="correct-${optionCounter}">
                        Đúng
                    </label>
                </div>
            </div>
            <div class="col-1 text-center">
                <button type="button" class="btn-remove-option" onclick="removeOption('option-${optionCounter}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    optionsList.appendChild(optionDiv);
}

// Remove option
function removeOption(optionId) {
    const option = document.getElementById(optionId);
    if (option) {
        option.remove();
        updateOptionLabels();
    }
}

// Update option labels
function updateOptionLabels() {
    const optionsList = document.getElementById('optionsList');
    const options = optionsList.children;
    
    for (let i = 0; i < options.length; i++) {
        const label = options[i].querySelector('strong');
        if (label) {
            label.textContent = String.fromCharCode(65 + i) + '.';
        }
    }
}

// Update correct answer highlighting
function updateCorrectAnswer(checkbox) {
    const optionRow = checkbox.closest('.option-row');
    const questionType = document.getElementById('questionType').value;
    
    if (questionType === 'SINGLE_CHOICE' && checkbox.checked) {
        // Remove correct class from all options
        document.querySelectorAll('.option-row').forEach(row => {
            row.classList.remove('correct');
        });
    }
    
    if (checkbox.checked) {
        optionRow.classList.add('correct');
    } else {
        optionRow.classList.remove('correct');
    }
}

// Submit form
async function handleSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const questionType = document.getElementById('questionType').value;
    
    // Prepare question data
    const questionData = {
        question_title: document.getElementById('questionTitle').value.trim(),
        question_text: document.getElementById('questionText').value.trim(),
        question_type: questionType,
        difficulty_level: document.getElementById('difficultyLevel').value,
        category_id: document.getElementById('categoryId').value || null
    };

    // Prepare options if multiple choice
    if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
        const optionRows = document.querySelectorAll('.option-row');
        const options = [];
        
        optionRows.forEach(row => {
            const text = row.querySelector('.option-text').value.trim();
            const isCorrect = row.querySelector('.form-check-input').checked;
            const optionId = row.dataset.optionId;
            
            if (text) {
                const optionData = {
                    option_text: text,
                    is_correct: isCorrect
                };
                
                if (optionId) {
                    optionData.option_id = parseInt(optionId);
                }
                
                options.push(optionData);
            }
        });

        // Validate at least one correct answer
        if (options.filter(opt => opt.is_correct).length === 0) {
            alert('Vui lòng chọn ít nhất một đáp án đúng!');
            return;
        }

        questionData.options = options;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể cập nhật câu hỏi');
        }

        alert('✅ Cập nhật câu hỏi thành công!');
        window.location.href = 'question-list.html';
        
    } catch (error) {
        console.error('Error updating question:', error);
        alert('❌ Lỗi: ' + error.message);
        showLoading(false);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    questionId = getQuestionIdFromUrl();
    
    console.log('🚀 Edit Question Page Initialized');
    console.log('📌 Question ID from URL:', questionId);
    console.log('🔑 Token exists:', !!localStorage.getItem('token'));
    
    if (!questionId) {
        alert('❌ Không tìm thấy ID câu hỏi!\n\nURL phải có dạng: edit-question.html?id=123');
        window.location.href = 'question-list.html';
        return;
    }

    // Load categories and question
    loadCategories();
    loadQuestion();

    // Event listeners
    document.getElementById('questionType').addEventListener('change', handleQuestionTypeChange);
    document.getElementById('editQuestionForm').addEventListener('submit', handleSubmit);
    
    console.log('✅ Event listeners attached');
});
