# Hệ thống Quản lý Đề tài Nghiên cứu Khoa học (Scientific Research Project Management System)

## 1. Giới thiệu chung
Hệ thống Quản lý Đề tài Nghiên cứu Khoa học là một giải pháp phần mềm toàn diện được thiết kế để số hóa và tối ưu hóa quy trình quản lý các đề tài nghiên cứu từ khâu đăng ký, xét duyệt, đánh giá đến nghiệm thu. Hệ thống giúp kết nối các nhà nghiên cứu, hội đồng đánh giá và ban quản lý một cách minh bạch, hiệu quả và tự động hóa.

## 2. Mục tiêu của Hệ thống
- **Số hóa quy trình:** Chuyển đổi các quy trình quản lý giấy tờ truyền thống sang nền tảng kỹ thuật số.
- **Tăng cường tính minh bạch:** Theo dõi trạng thái đề tài và kết quả đánh giá theo thời gian thực.
- **Tự động hóa thông báo:** Tích hợp hệ thống thông báo sự kiện (Event-driven Notification) giúp các bên liên quan cập nhật kịp thời.
- **Hỗ trợ quyết định:** Cung cấp thông tin chi tiết và biên bản đánh giá từ Hội đồng một cách chính xác, bảo mật.

## 3. Kiến trúc Hệ thống
Hệ thống được xây dựng theo mô hình Client-Server hiện đại, phân tách rõ ràng giữa Frontend (giao diện người dùng) và Backend (xử lý nghiệp vụ và dữ liệu).
- **Backend:** Cung cấp các RESTful APIs, xử lý logic nghiệp vụ, quản lý phân quyền và giao tiếp với cơ sở dữ liệu. Sử dụng kiến trúc hướng sự kiện (Event-driven Architecture) để xử lý hệ thống thông báo bất đồng bộ một cách tối ưu.
- **Frontend:** Ứng dụng Single Page Application (SPA) phản hồi nhanh, mang lại trải nghiệm người dùng mượt mà, linh hoạt và trực quan.

## 4. Các Module và Chức năng chính
### 4.1. Quản lý Người dùng & Xác thực (Authentication & Authorization)
- Đăng ký, đăng nhập và phân quyền bảo mật thông qua JWT (JSON Web Token).
- Phân chia vai trò hệ thống rõ ràng: Quản trị viên (Admin), Nghiên cứu viên (Researcher), Thành viên Hội đồng (Council Member), Thư ký Hội đồng (Secretary).

### 4.2. Quản lý Đề tài (Topic Management)
- Gửi đề xuất đề tài và nộp tài liệu đính kèm liên quan (file thuyết minh, báo cáo tiến độ).
- Theo dõi toàn bộ vòng đời của đề tài: *Đề xuất -> Chờ duyệt -> Đang thực hiện -> Chờ đánh giá -> Hoàn thành / Hủy bỏ*.

### 4.3. Quản lý Đánh giá và Hội đồng (Council & Evaluation Management)
- Thành lập Hội đồng đánh giá, phân công nhiệm vụ cho Thư ký và các ủy viên Hội đồng.
- Quản lý chi tiết các phiên họp Hội đồng (Council Sessions).
- Cung cấp quyền truy cập tài liệu thuyết minh bảo mật và hệ thống nhập điểm, nhận xét cho các thành viên hội đồng.
- Tự động tổng hợp biên bản họp và điểm đánh giá trung bình.

### 4.4. Hệ thống Thông báo (Notification System)
- Gửi thông báo tự động cho người dùng về các thay đổi quan trọng như: kết quả duyệt đề tài, lịch họp hội đồng, kết quả đánh giá.
- Hỗ trợ đa ngôn ngữ (chính: Tiếng Việt), thông báo có ngữ cảnh rõ ràng và sử dụng cơ chế Queue/Event để không chặn các tiến trình chính của hệ thống.

## 5. Công nghệ sử dụng
Hệ thống được phát triển với các công nghệ và bộ thư viện mới nhất, đảm bảo tính ổn định, hiệu năng và khả năng mở rộng.

### 5.1. Backend
- **Ngôn ngữ & Framework:** Java 17, Spring Boot 4.0.3
- **Cơ sở dữ liệu:** MySQL (Môi trường Production), H2 (Môi trường Test)
- **Quản lý phiên bản Database:** Flyway
- **Bảo mật:** Spring Security, JSON Web Token (JJWT 0.12.x)
- **Công cụ hỗ trợ:** Lombok, MapStruct (Data Mapping), OpenAPI 3 / Swagger (Tài liệu hóa API)
- **Testing & Quality:** JUnit, Mockito, JaCoCo (Kiểm tra độ phủ mã nguồn)

### 5.2. Frontend
- **Ngôn ngữ & Trình biên dịch:** React 19 (JavaScript/TypeScript), Vite
- **Quản lý trạng thái (State Management):** Zustand
- **Giao diện (UI/UX):** Tailwind CSS, Radix UI
- **Xử lý Form & Validation:** React Hook Form, Yup
- **Tương tác mạng:** Axios
- **Hiển thị tài liệu:** PDF.js, React-pdf-viewer
