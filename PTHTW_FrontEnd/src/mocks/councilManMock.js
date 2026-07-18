// File: src/mocks/councilManMock.js

export const MEMBER_ROLES = ["Chủ tịch", "Thư ký", "Phản biện 1", "Phản biện 2", "Ủy viên"];

export const MOCK_EXPERTS = [
  { name: "PGS.TS. Nguyễn Văn An", email: "nvaan@hcmus.edu.vn", unit: "Đại học Khoa học Tự nhiên" },
  { name: "PGS.TS. Trần Thị Bình", email: "ttbinh@uit.edu.vn", unit: "Đại học Công nghệ Thông tin" },
  { name: "TS. Lê Minh Cường", email: "lmcuong@hcmuaf.edu.vn", unit: "Đại học Nông Lâm TP.HCM" },
  { name: "GS.TS. Phạm Quốc Dũng", email: "pqdung@vnuhcm.edu.vn", unit: "Đại học Quốc gia TP.HCM" },
  { name: "TS. Hoàng Thị Oanh", email: "htoanh@tdtu.edu.vn", unit: "Đại học Tôn Đức Thắng" },
  { name: "PGS.TS. Đặng Văn Phúc", email: "dvphuc@bku.edu.vn", unit: "Đại học Bách khoa TP.HCM" },
  { name: "TS. Nguyễn Minh Quân", email: "nmquan@huflit.edu.vn", unit: "Đại học Ngoại ngữ Tin học" },
  { name: "GS.TS. Bùi Thị Hoa", email: "bthoa@hcmute.edu.vn", unit: "Đại học Sư phạm Kỹ thuật" },
  { name: "TS. Vũ Đức Long", email: "vdlong@iuh.edu.vn", unit: "Đại học Công nghiệp TP.HCM" },
  { name: "PGS.TS. Lưu Thị Kim Thi", email: "ltkimthi@hcmulaw.edu.vn", unit: "Đại học Luật TP.HCM" },
];

export const MOCK_TOPICS = [
  { id: 1, code: "DT001", title: "Nghiên cứu ứng dụng AI trong giáo dục đại học Việt Nam", pi: "Nguyễn Thị Hoa" },
  { id: 2, code: "DT002", title: "Phát triển hệ thống IoT thông minh cho nông nghiệp bền vững", pi: "Trần Văn Minh" },
  { id: 3, code: "DT003", title: "Blockchain trong quản lý chuỗi cung ứng dược phẩm Việt Nam", pi: "Lê Thị Lan" },
  { id: 4, code: "DT004", title: "Mô hình học máy dự đoán và phòng ngừa dịch bệnh đô thị", pi: "Phạm Quốc Hùng" },
  { id: 5, code: "DT005", title: "Tối ưu hóa thuật toán xử lý ngôn ngữ tự nhiên tiếng Việt", pi: "Hoàng Thị Thu" },
  { id: 6, code: "DT006", title: "Nghiên cứu vật liệu nano ứng dụng trong y học tái tạo", pi: "Đặng Văn Long" },
  { id: 7, code: "DT007", title: "Phân tích tác động kinh tế của chuyển đổi số doanh nghiệp", pi: "Bùi Thị Duyên" },
];

export const COUNCIL_STATUS = {
  pending: { label: "Chờ họp", bg: "bg-yellow-100", text: "text-yellow-800" },
  ongoing: { label: "Đang họp", bg: "bg-blue-100", text: "text-blue-700" },
  finished: { label: "Đã có Biên bản", bg: "bg-green-100", text: "text-green-700" },
};

export const INITIAL_COUNCILS = [
  { id: 1, name: "HĐ CNTT – 01/2026", topic: "Nghiên cứu ứng dụng AI trong giáo dục đại học Việt Nam", pi: "Nguyễn Thị Hoa", datetime: "20/03/2026 14:00", location: "Phòng B.306", status: "pending", memberCount: 5 },
  { id: 2, name: "HĐ Kỹ thuật – 01/2026", topic: "Phát triển hệ thống IoT thông minh cho nông nghiệp bền vững", pi: "Trần Văn Minh", datetime: "18/03/2026 09:00", location: "Google Meet", status: "ongoing", memberCount: 5 },
  { id: 3, name: "HĐ Kinh tế – 02/2025", topic: "Blockchain trong quản lý chuỗi cung ứng dược phẩm Việt Nam", pi: "Lê Thị Lan", datetime: "10/03/2026 14:00", location: "Phòng A.204", status: "finished", memberCount: 5 },
  { id: 4, name: "HĐ Y dược – 01/2026", topic: "Nghiên cứu vật liệu nano ứng dụng trong y học tái tạo", pi: "Đặng Văn Long", datetime: "25/03/2026 08:30", location: "Phòng C.102", status: "pending", memberCount: 5 },
  { id: 5, name: "HĐ Kinh tế – 01/2026", topic: "Phân tích tác động kinh tế của chuyển đổi số doanh nghiệp", pi: "Bùi Thị Duyên", datetime: "22/03/2026 13:30", location: "Zoom Meeting", status: "pending", memberCount: 5 },
];

export const HEADERS = ["Tên Hội đồng", "Đề tài phụ trách", "Thời gian & Địa điểm", "Trạng thái", "Hành động"];

// Hàm logic hỗ trợ đếm số lượng Role
export const getRoleCounts = members => ({
  chuTich: members.filter(m => m.role === "Chủ tịch").length,
  thuKy: members.filter(m => m.role === "Thư ký").length,
  phanBien: members.filter(m => m.role === "Phản biện 1" || m.role === "Phản biện 2").length,
  uyVien: members.filter(m => m.role === "Ủy viên").length,
});

// Hàm kiểm tra tính hợp lệ cơ cấu
export const isQuorumMet = counts =>
  counts.chuTich === 1 && counts.thuKy === 1 && counts.phanBien === 2;