// File: src/mocks/departmentMock.js

export const DEPT_FIELDS = ["CNTT", "Kỹ thuật", "Kinh tế", "Khoa học tự nhiên", "Y dược"];

export const STATUS_CFG = {
  pending: { label: "Chờ duyệt", bg: "bg-yellow-100", text: "text-yellow-800" },
  approved: { label: "Đã duyệt", bg: "bg-green-100", text: "text-green-800" },
  revision: { label: "Yêu cầu sửa", bg: "bg-red-100", text: "text-red-700" },
};

export const INITIAL_TOPICS = [
  {
    id: 1,
    code: "DT001",
    title: "Nghiên cứu ứng dụng AI trong giáo dục đại học Việt Nam",
    pi: "Nguyễn Thị Hoa",
    field: "CNTT",
    submittedAt: "01/03/2026",
    status: "pending",
  },
  {
    id: 2,
    code: "DT002",
    title: "Phát triển hệ thống IoT thông minh cho nông nghiệp bền vững",
    pi: "Trần Văn Minh",
    field: "Kỹ thuật",
    submittedAt: "02/03/2026",
    status: "approved",
  },
  {
    id: 3,
    code: "DT003",
    title: "Blockchain trong quản lý chuỗi cung ứng dược phẩm Việt Nam",
    pi: "Lê Thị Lan",
    field: "Kinh tế",
    submittedAt: "03/03/2026",
    status: "revision",
  },
  {
    id: 4,
    code: "DT004",
    title: "Mô hình học máy dự đoán và phòng ngừa dịch bệnh đô thị",
    pi: "Phạm Quốc Hùng",
    field: "CNTT",
    submittedAt: "04/03/2026",
    status: "pending",
  },
  {
    id: 5,
    code: "DT005",
    title: "Tối ưu hóa thuật toán xử lý ngôn ngữ tự nhiên tiếng Việt",
    pi: "Hoàng Thị Thu",
    field: "CNTT",
    submittedAt: "05/03/2026",
    status: "pending",
  },
  {
    id: 6,
    code: "DT006",
    title: "Nghiên cứu vật liệu nano ứng dụng trong y học tái tạo",
    pi: "Đặng Văn Long",
    field: "Y dược",
    submittedAt: "06/03/2026",
    status: "pending",
  },
  {
    id: 7,
    code: "DT007",
    title: "Phân tích tác động kinh tế của chuyển đổi số doanh nghiệp",
    pi: "Bùi Thị Duyên",
    field: "Kinh tế",
    submittedAt: "07/03/2026",
    status: "approved",
  },
  {
    id: 8,
    code: "DT008",
    title: "Ứng dụng GIS và viễn thám trong quản lý tài nguyên nước",
    pi: "Võ Minh Khoa",
    field: "Khoa học tự nhiên",
    submittedAt: "08/03/2026",
    status: "pending",
  },
];

export const CHECKLIST_ITEMS = [
  { id: "form", label: "Hồ sơ đúng biểu mẫu quy định" },
  { id: "noDebt", label: "Chủ nhiệm đề tài không vi phạm / nợ đọng" },
  { id: "content", label: "Nội dung phù hợp định hướng nghiên cứu của Khoa" },
];

export const HEADERS = [
  "Mã ĐT",
  "Tên đề tài",
  "Chủ nhiệm",
  "Lĩnh vực",
  "Ngày nộp",
  "Trạng thái",
  "Hành động",
];