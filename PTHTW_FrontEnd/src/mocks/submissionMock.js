// File: src/mocks/submissionMock.js

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
    "Phát triển công nghệ"
  ];
  
  export const SCIENCE_FIELDS = [
    "Khoa học tự nhiên", 
    "Khoa học xã hội", 
    "Kỹ thuật & Công nghệ", 
    "Khoa học y dược", 
    "Kinh tế & Kinh doanh"
  ];
  
  export const MEMBER_ROLES = [
    "Thành viên chính", 
    "Thư ký hành chính", 
    "Phó chủ nhiệm", 
    "Cộng tác viên"
  ];
  
  export const PI_INFO = {
    name: "Nguyễn Thị Hoài Thương",
    unit: "Khoa Công nghệ Thông tin",
    email: "2351010207thuong@ou.edu.vn",
  };
  
  // Cấu trúc dữ liệu trống để Reset form
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