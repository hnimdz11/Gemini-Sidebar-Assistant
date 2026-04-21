<p align="center">
  <img src="icon128.png" alt="Gemini Sidebar Assistant" width="128" height="128">
</p>

<h1 align="center">Gemini Sidebar Assistant</h1>

<p align="center">
  <strong>Trợ lý AI Gemini ngay trên sidebar Chrome — tóm tắt, dịch, trò chuyện.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-34A853?logo=google&logoColor=white" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Gemini_API-2.5_Flash_%7C_Pro-8B5CF6?logo=google&logoColor=white" alt="Gemini API">
  <img src="https://img.shields.io/badge/Version-1.1.0-FF6B35" alt="Version 1.1.0">
</p>

---

## ✨ Giới thiệu

**Gemini Sidebar Assistant** là extension Chrome mở trợ lý AI Gemini ngay trong sidebar trình duyệt, giúp bạn tóm tắt nội dung trang web, dịch song ngữ trực tiếp trên trang, và trò chuyện tự do với AI — tất cả chỉ trong một cú nhấp chuột.

Không cần chuyển tab. Không cần copy-paste. Mọi thứ ngay tại chỗ.

---

## 🚀 Tính năng nổi bật

### 💬 Trò chuyện AI thời gian thực
Hỏi đáp trực tiếp với Gemini 2.5 Flash hoặc Gemini 2.5 Pro. Phản hồi streaming từng ký tự, hiển thị Markdown đầy đủ (code block, bảng, danh sách) ngay trong sidebar.

### 📄 Tóm tắt trang web 1 Click
Nhấn nút **"Tóm tắt trang"** — extension tự động trích xuất nội dung trang hiện tại và gửi cho Gemini phân tích. Tùy chỉnh độ dài (ngắn gọn / vừa phải / chi tiết) và văn phong (dễ hiểu / chuyên nghiệp / gần gũi).

### 🌐 Dịch song ngữ trực tiếp trên trang
Nhấn **"Dịch trang này"** — extension quét các đoạn nội dung chính (bỏ qua nav, menu, code) và chèn bản dịch tiếng Việt ngay bên dưới mỗi đoạn gốc. Nhấn lại để xóa bản dịch.

### 🖱️ Gửi văn bản từ Context Menu
Bôi đen bất kỳ đoạn văn bản nào trên trang → chuột phải → **"Gửi vào Gemini Sidebar"**. Sidebar mở ra và tự điền văn bản, sẵn sàng xử lý.

### 🕐 Lịch sử trò chuyện
Mọi cuộc trò chuyện được tự động lưu lại. Mở lại bất kỳ lúc nào, hoặc xóa toàn bộ khi cần.

### 🌓 Giao diện Sáng / Tối
Chuyển đổi theme sáng-tối chỉ với 1 nút bấm. Mặc định Dark Mode cho trải nghiệm dễ chịu với mắt.

### ✏️ Chỉnh sửa tin nhắn đã gửi
Nhấn nút chỉnh sửa trên tin nhắn đã gửi để sửa lại câu hỏi — không cần gõ lại từ đầu.

### 💡 Gợi ý câu hỏi thông minh
Sau mỗi câu trả lời, AI tự động gợi ý 3 câu hỏi chuyên sâu liên quan để bạn khám phá tiếp.

### ⚙️ Tuỳ chỉnh linh hoạt
- **Chọn model AI**: Gemini 2.5 Flash (nhanh) hoặc Gemini 2.5 Pro (sâu)
- **Độ dài tóm tắt**: Ngắn gọn / Vừa phải / Chi tiết
- **Văn phong**: Dễ hiểu / Chuyên nghiệp / Gần gũi
- **API Key**: Nhập key Gemini API miễn phí của bạn

---

## 📸 Ảnh chụp màn hình

> Xem thư mục `promo/` để xem đầy đủ các ảnh quảng bá.

---

## 🛠️ Cài đặt

### Từ Chrome Web Store
1. Truy cập [Chrome Web Store](#) (link sẽ cập nhật)
2. Nhấn **"Thêm vào Chrome"**
3. Nhấn icon extension → Sidebar mở ra
4. Vào **⚙ Cài đặt** → Nhập Gemini API Key

### Cài đặt thủ công (Developer Mode)
1. Clone repository này:
   ```bash
   git clone https://github.com/your-username/gemini-sidebar-extension.git
   ```
2. Mở Chrome → `chrome://extensions/`
3. Bật **Developer mode** (góc trên phải)
4. Nhấn **"Load unpacked"** → Chọn thư mục dự án
5. Nhấn icon extension trên toolbar → Sidebar mở ra

---

## 🔑 Lấy API Key miễn phí

1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Đăng nhập tài khoản Google
3. Nhấn **"Create API Key"**
4. Copy key → Dán vào phần Cài đặt của extension

> 💡 Gemini API miễn phí cho cá nhân với giới hạn cao (15 RPM cho Flash, 2 RPM cho Pro).

---

## 🏗️ Công nghệ sử dụng

| Công nghệ | Mô tả |
|---|---|
| **Chrome Extension Manifest V3** | Nền tảng extension hiện đại |
| **Side Panel API** | Hiển thị trong sidebar Chrome |
| **Gemini API** | Streaming response từ Google AI |
| **Marked.js** | Render Markdown sang HTML |
| **DOMPurify** | Sanitize HTML, chống XSS |
| **Google Translate API** | Dịch song ngữ inline |
| **Chrome Storage API** | Lưu trữ cài đặt & lịch sử |
| **Context Menus API** | Menu chuột phải |

---

## 📂 Cấu trúc dự án

```
gemini-sidebar-extension/
├── manifest.json        # Manifest V3 config
├── background.js        # Service worker: context menu, side panel
├── sidepanel.html       # Giao diện sidebar
├── sidepanel.css        # Theme sáng/tối, responsive
├── sidepanel.js         # Logic chat, API, dịch, lịch sử
├── marked.min.js        # Thư viện Markdown
├── purify.min.js        # Thư viện sanitize HTML
├── icon16.png           # Icon 16x16
├── icon48.png           # Icon 48x48
└── icon128.png          # Icon 128x128
```

---

## 🔒 Quyền (Permissions)

| Quyền | Lý do |
|---|---|
| `sidePanel` | Hiển thị extension trong sidebar |
| `storage` | Lưu API key, cài đặt, lịch sử chat |
| `activeTab` | Đọc nội dung tab hiện tại để tóm tắt/dịch |
| `scripting` | Inject script đọc nội dung trang & chèn bản dịch |
| `contextMenus` | Menu chuột phải "Gửi vào Gemini Sidebar" |

---

## 📄 License

MIT License — Tự do sử dụng, chỉnh sửa và phân phối.

---

<p align="center">
  Made with ❤️ for Vietnamese users
</p>
