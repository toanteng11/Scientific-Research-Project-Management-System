// File: src/mocks/researcherMock.js

export const STEPS = [
    { id: 1, label: "Thông tin chung" },
    { id: 2, label: "Tổng quan" },
    { id: 3, label: "Nội dung & Phương pháp" },
    { id: 4, label: "Sản phẩm & Kinh phí" },
    { id: 5, label: "Nhân sự & Đính kèm" },
  ];
  
  export const RESEARCH_TYPES = [
    "Cơ bản",
    "Ứng dụng",
    "Triển khai thực nghiệm",
    "Phát triển công nghệ",
  ];
  
  export const SCIENCE_FIELDS = [
    "Khoa học tự nhiên",
    "Khoa học xã hội",
    "Kỹ thuật & Công nghệ",
    "Khoa học y dược",
    "Kinh tế & Kinh doanh",
  ];
  
  export const MEMBER_ROLES = [
    "Thành viên",
    "Thư ký",
    "Phó chủ nhiệm",
    "Cộng tác viên",
  ];
  
  export const EMPTY_FORM = {
    titleVN: "",
    titleEN: "",
    researchType: "",
    scienceField: "",
    specialtyCode: "",
    duration: "",
    startDate: "",
    overview: "",
    urgency: "",
    generalObj: "",
    specificObj: "",
    researchScope: "",
    researchContent: "",
    methodology: "",
    product1: "",
    product2: "",
    budget: "",
  };
  
  export const PI_INFO = {
    name: "Nguyễn Thị Hoài Thương",
    unit: "Đại Học Mở TP.HCM",
    email: "2351010207thuong@ou.edu.vn",
  };
  
  export const INITIAL_TOPICS = [
    {
      id: 1,
      code: "DT001",
      title: "Nghiên cứu ứng dụng AI trong giáo dục đại học tại Việt Nam",
      submittedAt: "16/2/2026",
      status: "pending",
    },
    {
      id: 2,
      code: "DT002",
      title: "Phát triển hệ thống quản lý học tập thông minh dựa trên dữ liệu lớn",
      submittedAt: "16/2/2026",
      status: "revision",
    },
    {
      id: 3,
      code: "DT003",
      title: "Mô hình kinh tế tuần hoàn trong ngành dệt may Việt Nam",
      submittedAt: "16/2/2026",
      status: "approved",
    },
    {
      id: 4,
      code: "DT004",
      title: "Tác động của biến đổi khí hậu đến nông nghiệp đồng bằng sông Cửu Long",
      submittedAt: "16/2/2026",
      status: "approved",
    },
    {
      id: 5,
      code: "DT005",
      title: "Giải pháp năng lượng tái tạo cho khu vực nông thôn Việt Nam",
      submittedAt: "16/2/2026",
      status: "pending",
    },
    {
      id: 6,
      code: "DT006",
      title: "Đặc điểm ngôn ngữ học của tiếng Việt hiện đại và các biến thể vùng miền",
      submittedAt: "10/1/2026",
      status: "draft",
    },
  ];
  
  export const PAGE_SIZE = 5;
  
  export const STATUS_CFG = {
    draft: { label: "Nháp", cls: "bg-gray-100 text-gray-600" },
    pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700" },
    revision: { label: "Yêu cầu sửa", cls: "bg-red-100 text-red-700" },
    approved: { label: "Đã duyệt", cls: "bg-green-100 text-green-700" },
  };