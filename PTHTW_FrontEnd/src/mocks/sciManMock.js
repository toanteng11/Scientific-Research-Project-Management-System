// File: src/mocks/sciManMock.js

export const FACULTIES = ["CNTT", "Kỹ thuật", "Kinh tế", "Khoa học tự nhiên", "Y dược"];
export const SCHOOL_YEARS = ["2025-2026", "2024-2025", "2023-2024"];
export const PAGE_SIZE = 5;

export const STATUS_CFG = {
  pending_check: { label: "Chờ kiểm tra", bg: "bg-yellow-100", text: "text-yellow-800" },
  pending_council: { label: "Chờ lập HĐ", bg: "bg-blue-100", text: "text-blue-700" },
  council_done: { label: "Đã lập HĐ", bg: "bg-green-100", text: "text-green-700" },
  needs_supplement: { label: "Yêu cầu bổ sung", bg: "bg-red-100", text: "text-red-700" },
};

export const CHECKLIST_ITEMS = [
  { id: "format", label: "Hồ sơ đúng biểu mẫu quy định" },
  { id: "leader", label: "Chủ nhiệm đề tài đủ điều kiện chủ trì" },
  { id: "noPenalty", label: "Không vi phạm / không nợ đọng đề tài cũ" },
  { id: "budget", label: "Dự toán kinh phí đúng tiêu chuẩn quy định" },
  { id: "signatures", label: "Đầy đủ chữ ký và xác nhận từ Khoa" },
];

export const MOCK_FACULTY_NOTES =
  "Trưởng Khoa đã xem xét và phê duyệt về mặt học thuật. Nội dung đề tài phù hợp với định hướng nghiên cứu của Khoa. Chủ nhiệm đề tài có năng lực và kinh nghiệm chuyên môn tốt. Đề nghị Phòng QLKH kiểm tra thủ tục hành chính và xử lý theo quy định.";

export const INITIAL_TOPICS = [
  { id: 1, code: "DT001", title: "Nghiên cứu ứng dụng AI trong giáo dục đại học Việt Nam", pi: "Nguyễn Thị Hoa", faculty: "CNTT", year: "2025-2026", status: "pending_check" },
  { id: 2, code: "DT002", title: "Phát triển hệ thống IoT thông minh cho nông nghiệp bền vững", pi: "Trần Văn Minh", faculty: "Kỹ thuật", year: "2025-2026", status: "pending_council" },
  { id: 3, code: "DT003", title: "Blockchain trong quản lý chuỗi cung ứng dược phẩm Việt Nam", pi: "Lê Thị Lan", faculty: "Kinh tế", year: "2025-2026", status: "needs_supplement" },
  { id: 4, code: "DT004", title: "Mô hình học máy dự đoán và phòng ngừa dịch bệnh đô thị", pi: "Phạm Quốc Hùng", faculty: "CNTT", year: "2025-2026", status: "pending_check" },
  { id: 5, code: "DT005", title: "Tối ưu hóa thuật toán xử lý ngôn ngữ tự nhiên tiếng Việt", pi: "Hoàng Thị Thu", faculty: "CNTT", year: "2025-2026", status: "council_done" },
  { id: 6, code: "DT006", title: "Nghiên cứu vật liệu nano ứng dụng trong y học tái tạo", pi: "Đặng Văn Long", faculty: "Y dược", year: "2024-2025", status: "pending_council" },
  { id: 7, code: "DT007", title: "Phân tích tác động kinh tế của chuyển đổi số doanh nghiệp", pi: "Bùi Thị Duyên", faculty: "Kinh tế", year: "2024-2025", status: "council_done" },
  { id: 8, code: "DT008", title: "Ứng dụng GIS và viễn thám trong quản lý tài nguyên nước", pi: "Võ Minh Khoa", faculty: "Khoa học tự nhiên", year: "2024-2025", status: "pending_check" },
  { id: 9, code: "DT009", title: "Nghiên cứu giải pháp năng lượng tái tạo cho khu vực nông thôn", pi: "Nguyễn Hoàng Anh", faculty: "Kỹ thuật", year: "2025-2026", status: "needs_supplement" },
  { id: 10, code: "DT010", title: "Xây dựng mô hình dự báo thị trường chứng khoán bằng Deep Learning", pi: "Trịnh Thị Mai", faculty: "Kinh tế", year: "2024-2025", status: "pending_check" },
];