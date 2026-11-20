# Nhật ký dùng AI · Phase 1

Codex đọc PRD-0 và kế hoạch do người dùng cung cấp, triển khai bằng TypeScript, dựng cảnh Three.js, viết scenario, chạy CLI và chơi thử bằng bàn phím qua Playwright. Hướng dẫn lặp lại nằm trong AGENTS.md. Tiến độ theo từng mốc nằm trong [TIEN-DO.md](../TIEN-DO.md).

Một lỗi build xuất phát từ việc gán sai kiểu vật liệu Three.js. Đã dùng vật liệu chuẩn có thuộc tính phát sáng và kiểm tra bằng TypeScript. Khi cài sạch trên Windows, tiến trình Vite đang mở giữ thư viện Rollup. Cần đóng preview trước khi chạy npm ci tại cùng thư mục.

Ước lượng thô hàng chục nghìn token gồm ngữ cảnh, mã, đầu ra công cụ và kiểm chứng. Phiên làm việc không cung cấp số liệu thanh toán. Dùng chung một lõi game và tái sử dụng scenario cho test lẫn bằng chứng giúp giảm lượng mã cần tạo.
