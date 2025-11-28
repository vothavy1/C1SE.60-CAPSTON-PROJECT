const API_BASE_URL = 'http://localhost:5000/api';

document.getElementById('createTestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const testName = document.getElementById('testName').value.trim();
    const testDescription = document.getElementById('testDescription').value.trim();
    const testType = document.getElementById('testType').value;

    // Validation
    if (!testName) {
        alert('Tên đề thi không được để trống!');
        return;
    }
    if (!testType) {
        alert('Vui lòng chọn loại đề!');
        return;
    }

    const testData = {
        test_name: testName,
        description: testDescription,
        duration_minutes: 60,
        difficulty_level: 'MEDIUM'
        // status sẽ được backend tự set default là 'ACTIVE'
    };

    try {
        await createTest(testData);
    } catch (error) {
        alert(error.message || 'Có lỗi xảy ra khi tạo đề thi!');
    }
});

async function createTest(testData) {
    try {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('Vui lòng đăng nhập để tiếp tục!');
        }
        
        const response = await fetch(`${API_BASE_URL}/tests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Tạo đề thi thất bại!');
        }
        alert('Tạo đề thi thành công!');
        window.location.href = 'test-list.html';
    } catch (error) {
        throw error;
    }
}
