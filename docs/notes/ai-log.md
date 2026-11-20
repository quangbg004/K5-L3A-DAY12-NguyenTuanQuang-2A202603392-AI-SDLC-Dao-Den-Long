# Nhật ký dùng AI · Phase 1

Codex đọc PRD-0 và kế hoạch do người dùng cung cấp, triển khai bằng TypeScript, dựng cảnh Three.js, viết scenario, chạy CLI và chơi thử bằng bàn phím qua Playwright. Hướng dẫn lặp lại nằm trong AGENTS.md. Tiến độ theo từng mốc nằm trong [TIEN-DO.md](../TIEN-DO.md).

Một lỗi build xuất phát từ việc gán sai kiểu vật liệu Three.js. Đã dùng vật liệu chuẩn có thuộc tính phát sáng và kiểm tra bằng TypeScript. Khi cài sạch trên Windows, tiến trình Vite đang mở giữ thư viện Rollup. Cần đóng preview trước khi chạy npm ci tại cùng thư mục.

Ước lượng thô hàng chục nghìn token gồm ngữ cảnh, mã, đầu ra công cụ và kiểm chứng. Phiên làm việc không cung cấp số liệu thanh toán. Dùng chung một lõi game và tái sử dụng scenario cho test lẫn bằng chứng giúp giảm lượng mã cần tạo.

## Phase 2

Codex đối chiếu Ticket-02 với PRD-0, cập nhật tuning, bản đồ và thứ tự bước. Tái sử dụng CLI, bộ fixture cũ, lớp hiển thị và bộ kiểm chứng trình duyệt. Một bài thử Edge phát hiện rằng bấm Esc ngay sau khi Tiếp tục có thể bị bỏ qua. Đã đặt lại trạng thái nút khi trao quyền điều khiển về game và chạy lại bài thử. Khi đo đủ 21.600 tick, fixture được đặt bất tử và tắt gió để tránh rơi sớm; các replay mặc định kiểm tra riêng toàn bộ luật chơi.

AI đã tạo chuỗi input điều hướng trên bản đồ mặc định, lưu ba lượt thắng rồi chạy lại qua CLI độc lập để lấy tick, điểm và sự kiện. Chi phí thực tế không hiển thị. Ước lượng thô ở cấp hàng chục nghìn token, bao gồm đọc tài liệu, mã và kết quả chạy.
