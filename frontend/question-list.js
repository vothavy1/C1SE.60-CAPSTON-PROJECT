// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State
let currentPage = 1;
let currentFilters = {
    search: '',
    type: '',
    difficulty: ''
};

// Question type mapping
const questionTypeMap = {
    'MULTIPLE_CHOICE': { label: 'Trắc nghiệm nhiều đáp án', class: 'badge-multiple' },
    'SINGLE_CHOICE': { label: 'Trắc nghiệm một đáp án', class: 'badge-single' },
    'TEXT': { label: 'Tự luận', class: 'badge-text' },
    'CODING': { label: 'Coding', class: 'badge-coding' }
};

// Difficulty level mapping
const difficultyMap = {
    'EASY': { label: 'Dễ', class: 'difficulty-easy' },
    'MEDIUM': { label: 'Trung bình', class: 'difficulty-medium' },
    'HARD': { label: 'Khó', class: 'difficulty-hard' },
    'EXPERT': { label: 'Chuyên gia', class: 'difficulty-expert' }
};

/**
 * Lấy danh sách câu hỏi từ API
 */
async function fetchQuestions(page = 1, filters = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    showLoading(true);

    try {
        // Build query params
        const params = new URLSearchParams({
            page: page,
            limit: 20
        });

        if (filters.search) params.append('search', filters.search);
        if (filters.type) params.append('type', filters.type);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);

        const response = await fetch(`${API_BASE_URL}/questions?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Không thể tải danh sách câu hỏi');
        }

        const result = await response.json();
        
        if (result.success) {
            renderQuestions(result.data.questions);
            renderPagination(result.data.pagination);
        } else {
            showError('Không thể tải danh sách câu hỏi');
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        showError('Đã xảy ra lỗi khi tải danh sách câu hỏi');
    } finally {
        showLoading(false);
    }
}

/**
 * Render danh sách câu hỏi
 */
function renderQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    
    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div class="no-questions">
                <i class="bi bi-inbox"></i>
                <h4>Chưa có câu hỏi nào</h4>
                <p>Hãy tạo câu hỏi đầu tiên của bạn!</p>
                <a href="create-question.html" class="btn btn-success mt-3">
                    <i class="bi bi-plus-circle"></i> Thêm câu hỏi mới
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = questions.map(question => {
        const typeInfo = questionTypeMap[question.question_type] || { label: question.question_type, class: 'badge-multiple' };
        const difficultyInfo = difficultyMap[question.difficulty_level] || { label: question.difficulty_level, class: 'difficulty-easy' };
        
        // Render options if available
        let optionsHtml = '';
        if (question.QuestionOptions && question.QuestionOptions.length > 0) {
            optionsHtml = `
                <div class="options-list">
                    <h6 class="mb-3"><i class="bi bi-list-ul"></i> Các đáp án lựa chọn:</h6>
                    ${question.QuestionOptions.map((option, index) => `
                        <div class="option-item ${option.is_correct ? 'correct' : ''}">
                            <i class="bi ${option.is_correct ? 'bi-check-circle-fill' : 'bi-circle'}"></i>
                            <span><strong>${String.fromCharCode(65 + index)}.</strong> ${option.option_text}</span>
                            ${option.is_correct ? '<span class="badge bg-success ms-auto">Đáp án đúng</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (question.question_type === 'TEXT') {
            optionsHtml = `
                <div class="options-list">
                    <p class="text-muted mb-0"><i class="bi bi-pencil"></i> Câu hỏi tự luận - Không có đáp án trắc nghiệm</p>
                </div>
            `;
        } else if (question.question_type === 'CODING') {
            optionsHtml = `
                <div class="options-list">
                    <p class="text-muted mb-0"><i class="bi bi-code-slash"></i> Câu hỏi Coding - Đánh giá bằng test cases</p>
                </div>
            `;
        }

        return `
            <div class="question-card">
                <div class="question-header">
                    <div class="flex-grow-1">
                        <div class="question-title">
                            <i class="bi bi-question-circle-fill text-primary"></i>
                            ${question.question_title || 'Không có tiêu đề'}
                        </div>
                        <div>
                            <span class="badge badge-type ${typeInfo.class}">${typeInfo.label}</span>
                            <span class="badge badge-difficulty ${difficultyInfo.class}">${difficultyInfo.label}</span>
                            ${question.QuestionCategory ? `<span class="badge bg-secondary ms-2">${question.QuestionCategory.category_name}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-end">
                        <button class="action-btn btn-edit" onclick="editQuestion(${question.question_id})">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteQuestion(${question.question_id})">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </div>
                </div>
                <div class="question-text">
                    <strong>Nội dung:</strong> ${question.question_text}
                </div>
                ${optionsHtml}
                <div class="mt-3 text-muted" style="font-size: 0.85rem;">
                    <i class="bi bi-calendar"></i> Tạo ngày: ${formatDate(question.created_at)}
                    ${question.Creator ? ` | <i class="bi bi-person"></i> ${question.Creator.full_name || question.Creator.username}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');
    
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const { currentPage, totalPages, total } = pagination;
    
    let paginationHtml = `
        <nav aria-label="Question pagination">
            <ul class="pagination">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                        <i class="bi bi-chevron-left"></i> Trước
                    </a>
                </li>
    `;

    // Show page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`;
    }

    paginationHtml += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                        Sau <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="text-center mt-2 text-muted">
            <small>Tổng số ${total} câu hỏi</small>
        </div>
    `;

    container.innerHTML = paginationHtml;
}

/**
 * Change page
 */
function changePage(page) {
    currentPage = page;
    fetchQuestions(page, currentFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Sửa câu hỏi
 */
function editQuestion(id) {
    window.location.href = `edit-question.html?id=${id}`;
}

/**
 * Xóa câu hỏi
 */
async function deleteQuestion(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Đã xóa câu hỏi thành công!');
            fetchQuestions(currentPage, currentFilters);
        } else {
            const error = await response.json();
            alert('Lỗi: ' + (error.message || 'Không thể xóa câu hỏi'));
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Đã xảy ra lỗi khi xóa câu hỏi');
    }
}

/**
 * Show/Hide loading indicator
 */
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const questionsContainer = document.getElementById('questionsContainer');
    
    if (show) {
        loadingIndicator.style.display = 'block';
        questionsContainer.style.display = 'none';
    } else {
        loadingIndicator.style.display = 'none';
        questionsContainer.style.display = 'block';
    }
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i> ${message}
        </div>
    `;
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Initialize filters
 */
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const filterDifficulty = document.getElementById('filterDifficulty');

    // Debounce search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            fetchQuestions(currentPage, currentFilters);
        }, 500);
    });

    // Filter by type
    filterType.addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        currentPage = 1;
        fetchQuestions(currentPage, currentFilters);
    });

    // Filter by difficulty
    filterDifficulty.addEventListener('change', (e) => {
        currentFilters.difficulty = e.target.value;
        currentPage = 1;
        fetchQuestions(currentPage, currentFilters);
    });
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    fetchQuestions(currentPage, currentFilters);
});
