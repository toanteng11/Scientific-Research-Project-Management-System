// File: src/mocks/councilMemMock.js

export const ROLE_CFG = {
    "Chủ tịch": { bg: "bg-rose-800", text: "text-white", dot: "bg-rose-400" },
    "Thư ký": { bg: "bg-blue-800", text: "text-white", dot: "bg-blue-400" },
    "Phản biện 1": { bg: "bg-orange-500", text: "text-white", dot: "bg-orange-300" },
    "Phản biện 2": { bg: "bg-amber-500", text: "text-white", dot: "bg-amber-300" },
    "Ủy viên": { bg: "bg-gray-500", text: "text-white", dot: "bg-gray-300" },
  };
  
  export const STATUS_CFG = {
    pending: { label: "Chưa đánh giá", bg: "bg-red-100", text: "text-red-700" },
    completed: { label: "Đã đánh giá", bg: "bg-green-100", text: "text-green-700" },
  };
  
  export const COUNCIL_MEMBER = {
    title: "GS.TS.",
    name: "Nguyễn Văn An",
    initials: "NA",
    role: "Thành viên Hội đồng",
    unit: "Đại học Khoa học Tự nhiên",
  };
  
  export const INITIAL_ASSIGNMENTS = [
    // Pending / Upcoming
    {
      id: 1,
      code: "DT001",
      title: "Nghiên cứu ứng dụng AI trong giáo dục đại học Việt Nam",
      pi: "Nguyễn Thị Hoa",
      role: "Chủ tịch",
      datetime: "20/03/2026 14:00",
      location: "Phòng B.306",
      council: "HĐ CNTT – 01/2026",
      status: "pending",
    },
    {
      id: 2,
      code: "DT002",
      title: "Phát triển hệ thống IoT thông minh cho nông nghiệp bền vững",
      pi: "Trần Văn Minh",
      role: "Phản biện 1",
      datetime: "22/03/2026 09:00",
      location: "Google Meet",
      council: "HĐ Kỹ thuật – 01/2026",
      status: "pending",
    },
    {
      id: 3,
      code: "DT003",
      title: "Blockchain trong quản lý chuỗi cung ứng dược phẩm Việt Nam",
      pi: "Lê Thị Lan",
      role: "Thư ký",
      datetime: "25/03/2026 14:00",
      location: "Phòng A.204",
      council: "HĐ Kinh tế – 01/2026",
      status: "pending",
    },
    {
      id: 4,
      code: "DT004",
      title: "Mô hình học máy dự đoán và phòng ngừa dịch bệnh đô thị",
      pi: "Phạm Quốc Hùng",
      role: "Phản biện 2",
      datetime: "28/03/2026 10:00",
      location: "Zoom Meeting",
      council: "HĐ CNTT – 02/2026",
      status: "pending",
    },
    {
      id: 5,
      code: "DT005",
      title: "Tối ưu hóa thuật toán xử lý ngôn ngữ tự nhiên tiếng Việt",
      pi: "Hoàng Thị Thu",
      role: "Ủy viên",
      datetime: "30/03/2026 09:00",
      location: "Phòng C.302",
      council: "HĐ CNTT – 03/2026",
      status: "pending",
    },
    // Completed
    {
      id: 6,
      code: "DT006",
      title: "Nghiên cứu vật liệu nano ứng dụng trong y học tái tạo",
      pi: "Đặng Văn Long",
      role: "Phản biện 1",
      datetime: "10/03/2026 14:00",
      location: "Phòng B.205",
      council: "HĐ Y dược – 01/2026",
      status: "completed",
    },
    {
      id: 7,
      code: "DT007",
      title: "Phân tích tác động kinh tế của chuyển đổi số doanh nghiệp",
      pi: "Bùi Thị Duyên",
      role: "Chủ tịch",
      datetime: "08/03/2026 09:00",
      location: "Google Meet",
      council: "HĐ Kinh tế – 02/2025",
      status: "completed",
    },
    {
      id: 8,
      code: "DT008",
      title: "Ứng dụng GIS và viễn thám trong quản lý tài nguyên nước",
      pi: "Võ Minh Khoa",
      role: "Thư ký",
      datetime: "05/03/2026 10:00",
      location: "Phòng A.101",
      council: "HĐ Khoa học tự nhiên – 01/2026",
      status: "completed",
    },
  ];
  
  export const TABS = [
    { id: "pending", label: "Sắp diễn ra / Chờ đánh giá" },
    { id: "completed", label: "Đã hoàn tất" },
  ];
  
  export const TABLE_HEADERS = [
    "Mã ĐT",
    "Tên đề tài nghiên cứu",
    "Vai trò Hội đồng",
    "Thời gian & Địa điểm",
    "Trạng thái",
    "Hành động",
  ];