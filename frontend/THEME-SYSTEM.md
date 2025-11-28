# 🎨 Theme System - CS60 Recruitment

## Tổng quan
Hệ thống theme hỗ trợ chuyển đổi giữa chế độ sáng (Light Mode) và tối (Dark Mode) trên toàn bộ ứng dụng.

## Cách sử dụng

### Cho người dùng:
1. **Tìm nút toggle theme** - Biểu tượng 🌙/☀️ ở góc trên bên phải header
2. **Click để chuyển đổi** - Nhấn vào nút để chuyển giữa chế độ sáng/tối
3. **Tự động lưu** - Lựa chọn của bạn được lưu và áp dụng cho tất cả các trang

### Cho developer:

## 1. Files chính

- `theme.css` - Chứa tất cả CSS cho light/dark mode
- `theme.js` - Logic quản lý theme (load, save, toggle)
- `theme-auto-init.js` - Script tự động khởi tạo theme (dùng cho trang không có theme.js)

## 2. Cách thêm theme vào trang mới

### Option A: Sử dụng theme.js (Recommended)
```html
<head>
  <link rel="stylesheet" href="theme.css">
  <script src="theme.js"></script>
</head>
<body class="dark-mode transition-colors duration-300">
  <!-- Header -->
  <nav class="header-bg">
    <div class="theme-toggle" id="themeToggle"></div>
    <span id="userName">Xin chào!</span>
    <button id="logoutBtn">Đăng xuất</button>
  </nav>
  
  <!-- Content -->
  <main>
    <div class="content-card">...</div>
  </main>
  
  <!-- Scripts -->
  <script>
    // Setup theme toggle
    ThemeManager.setupToggle('themeToggle');
  </script>
</body>
```

### Option B: Sử dụng theme-auto-init.js (Quick)
```html
<head>
  <!-- Không cần theme.css, sẽ tự động load -->
</head>
<body>
  <!-- Nội dung trang -->
  
  <script src="theme-auto-init.js"></script>
</body>
```

## 3. CSS Classes được hỗ trợ

### Container classes:
- `.header-bg` - Header với màu nền theo theme
- `.card-bg` hoặc `.content-card` - Card/Box với màu nền theo theme
- `.footer-border` - Footer với border theo theme
- `.text-subtitle` - Text phụ với màu nhạt hơn

### Button classes:
- `.btn-primary` - Nút chính (hồng/xám đậm)
- `.btn-secondary` - Nút phụ (hồng nhạt/xám)
- `.btn-accent` - Nút nhấn mạnh (trắng/đen với viền)

### Theme toggle:
- `.theme-toggle` - Nút toggle theme với animation

## 4. Màu sắc

### Light Mode (Chế độ sáng):
- Background: Gradient trắng xám nhạt (#f8fafc → #f1f5f9)
- Text: Xám đen (#334155)
- Primary Button: Hồng pastel (#f0abfc) với chữ đen
- Secondary Button: Hồng rất nhạt (#fae8ff) với chữ đen

### Dark Mode (Chế độ tối):
- Background: Gradient đen xanh (#1e293b → #0f172a)
- Text: Xám trắng (#e2e8f0)
- Primary Button: Hồng đậm (#ec4899) với chữ trắng
- Secondary Button: Đen (#1f2937) với viền hồng, chữ trắng

## 5. JavaScript API

```javascript
// Get theme manager
const tm = window.ThemeManager;

// Get current theme
const current = tm.getCurrentTheme(); // 'light' or 'dark'

// Init theme
tm.init(); // Load from localStorage

// Toggle theme
tm.toggle(); // Switch between light/dark

// Setup toggle button
tm.setupToggle('themeToggle'); // Auto-bind click event
```

## 6. LocalStorage

Theme preference được lưu trong localStorage với key `'theme'`:
- Value: `'light'` hoặc `'dark'`
- Mặc định: `'dark'` nếu chưa có

## 7. Các trang đã được cập nhật

✅ `recruiter.html` - Dashboard chính
✅ `test-list.html` - Danh sách đề thi
✅ `candidate-list.html` - Danh sách ứng viên
✅ `create-test.html` - Tạo đề thi mới

## 8. TODO - Các trang cần cập nhật

- [ ] `question-list.html`
- [ ] `create-question.html`
- [ ] `edit-test.html`
- [ ] `edit-question.html`
- [ ] `test-details.html`
- [ ] `report.html`
- [ ] `admin-dashboard.html`

## 9. Best Practices

1. **Luôn dùng semantic classes** thay vì inline styles:
   ```html
   <!-- ❌ Bad -->
   <div class="bg-white text-black">...</div>
   
   <!-- ✅ Good -->
   <div class="content-card">...</div>
   ```

2. **Thêm transition để mượt mà**:
   ```html
   <body class="dark-mode transition-colors duration-300">
   ```

3. **Test cả hai chế độ** trước khi deploy

4. **Sử dụng border thay vì box-shadow** cho better contrast

## 10. Troubleshooting

### Theme không chuyển đổi:
- Check xem `theme.js` đã được load chưa
- Check console có lỗi không
- Verify `themeToggle` element có đúng ID không

### Màu sắc không đúng:
- Check xem `theme.css` đã được load chưa
- Verify element có đúng class không (.content-card, .header-bg, etc.)
- Check xem có inline styles nào override không

### Theme không được lưu:
- Check localStorage có bị disable không
- Verify script `ThemeManager.setupToggle()` đã được gọi

---

**Tác giả**: CS60 Team  
**Version**: 1.0  
**Ngày cập nhật**: 2025-11-28
