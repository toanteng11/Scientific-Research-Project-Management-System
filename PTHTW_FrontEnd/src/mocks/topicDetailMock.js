// File: src/mocks/topicDetailMock.js

export const MACRO_STAGES = ["Khởi tạo", "Khoa duyệt", "QLKH duyệt", "Hội đồng đánh giá", "Kết luận"];

export const STATUS_CFG = {
  draft: { label: "Nháp", bg: "bg-gray-100", text: "text-gray-700" },
  pending: { label: "Chờ duyệt", bg: "bg-yellow-100", text: "text-yellow-800" },
  revision: { label: "Yêu cầu chỉnh sửa", bg: "bg-red-100", text: "text-red-700" },
  approved: { label: "Đã duyệt", bg: "bg-green-100", text: "text-green-800" },
};

export const ROLE_COLORS = {
  system: "bg-gray-200 text-gray-600",
  researcher: "bg-blue-100 text-blue-700",
  khoa: "bg-amber-100 text-amber-700",
  qlkh: "bg-indigo-100 text-indigo-700",
  council: "bg-purple-100 text-purple-700",
};

export const MOCK_TOPIC = {
  code: "DT001",
  status: "revision",
  currentStageIdx: 3,
  titleVN: "Nghiên cứu ứng dụng trí tuệ nhân tạo (AI) trong hỗ trợ giảng dạy và đánh giá kết quả học tập tại các trường đại học Việt Nam",
  titleEN: "Research on Applying Artificial Intelligence in Teaching Support and Learning Assessment at Vietnamese Universities",
  researchType: "Ứng dụng",
  scienceField: "Kỹ thuật & Công nghệ",
  specialtyCode: "48 06 01",
  duration: "24 tháng",
  startDate: "01/03/2026",
  overview: "Trong bối cảnh Cách mạng công nghiệp 4.0, AI đang dần trở thành công cụ không thể thiếu trong lĩnh vực giáo dục toàn cầu. Các hệ thống học tập thích ứng, đánh giá tự động và trợ lý ảo giảng dạy đã cho thấy tiềm năng to lớn trong việc nâng cao chất lượng và hiệu quả giáo dục.",
  urgency: "Hiện nay, chất lượng giáo dục đại học tại Việt Nam đang đối mặt với nhiều thách thức về cá nhân hóa học tập và đánh giá khách quan. Việc ứng dụng AI không chỉ giải quyết bài toán tải lượng công việc của giảng viên mà còn cá nhân hóa lộ trình học tập cho từng sinh viên.",
  generalObj: "Nghiên cứu, xây dựng và triển khai thử nghiệm một nền tảng AI tích hợp hỗ trợ giảng dạy và đánh giá học tập tại Trường Đại học Mở TP.HCM, từ đó đề xuất mô hình nhân rộng cho các trường đại học Việt Nam.",
  specificObj: "1. Phân tích và đánh giá hiện trạng ứng dụng AI trong giáo dục đại học tại Việt Nam và thế giới.\n2. Thiết kế mô hình tích hợp AI vào Hệ thống Quản lý Học tập (LMS) hiện có.\n3. Phát triển prototype các module AI: hỗ trợ giảng dạy, chấm điểm tự động, và phân tích học tập.",
  researchScope: "Sinh viên và giảng viên tại Trường Đại học Mở TP.HCM, năm học 2026–2027",
  methodology: "Sử dụng phương pháp nghiên cứu hỗn hợp (Mixed Methods) kết hợp định lượng và định tính, cùng với phương pháp phát triển phần mềm Agile/Scrum.",
  product1: "01 báo cáo tổng quan về ứng dụng AI trong giáo dục đại học Việt Nam; 01 hệ thống phần mềm prototype với ít nhất 3 module AI đã thử nghiệm; 01 quy trình triển khai chuẩn.",
  product2: "01 bài báo khoa học đăng trên tạp chí ISI/Scopus Q2 trở lên về kết quả nghiên cứu.",
  budget: "350.000.000 VNĐ",
  pi: { name: "Nguyễn Thị Hoài Thương", unit: "Khoa CNTT, Trường ĐH Mở TP.HCM", email: "2351010207thuong@ou.edu.vn" },
  members: [
    { name: "TS. Trần Minh Tuấn", unit: "Khoa CNTT", role: "Thành viên" },
    { name: "ThS. Lê Thị Mai Anh", unit: "Phòng QLKH", role: "Thư ký" },
    { name: "TS. Phạm Văn Đức", unit: "Khoa Kinh tế", role: "Cộng tác viên" },
  ],
};

export const TIMELINE_DATA = [
  {
    id: 1, roleType: "system",
    actor: "Hệ thống", role: "Hệ thống tự động",
    action: "đã tạo và lưu nháp đề tài",
    date: "01/02/2026", time: "09:00",
  },
  {
    id: 2, roleType: "researcher",
    actor: "Nguyễn Thị Hoài Thương", role: "Chủ nhiệm",
    action: "đã nộp đề tài để xét duyệt",
    date: "05/02/2026", time: "14:30",
  },
  {
    id: 3, roleType: "khoa",
    actor: "PGS.TS Lê Hoàng Nam", role: "Trưởng Khoa CNTT",
    action: "đã duyệt và chuyển lên Phòng QLKH",
    date: "08/02/2026", time: "10:15",
    comment: "Đề tài có hướng nghiên cứu phù hợp với định hướng phát triển của Khoa. Nội dung nghiên cứu có tính ứng dụng cao và mang tính thời sự. Đề xuất chuyển tiếp xét duyệt.",
  },
  {
    id: 4, roleType: "qlkh",
    actor: "TS. Phạm Thanh Bình", role: "Phòng QLKH",
    action: "đã xét duyệt và trình Hội đồng",
    date: "12/02/2026", time: "16:00",
    comment: "Hồ sơ đề tài đầy đủ, đảm bảo các điều kiện theo quy định. Dự toán kinh phí hợp lý. Đề nghị đưa vào lịch họp Hội đồng đánh giá.",
  },
  {
    id: 5, roleType: "council", type: "council_minutes",
    actor: "Hội đồng Đánh giá", role: "Hội đồng KH",
    action: "đã ban hành Biên bản Hội đồng",
    date: "16/02/2026", time: "09:00",
    minutesId: "BB-2026/HĐ-001",
  },
  {
    id: 6, roleType: "council", type: "revision", isLatest: true,
    actor: "GS.TS Nguyễn Văn Khoa", role: "Chủ tịch Hội đồng",
    action: "đã yêu cầu chỉnh sửa đề tài",
    date: "16/02/2026", time: "11:30",
    comment: "Hội đồng đã xem xét và ghi nhận đề tài có hướng nghiên cứu tốt. Tuy nhiên, đề nghị chủ nhiệm bổ sung và làm rõ các nội dung sau:\n\n1. Phần phương pháp nghiên cứu cần được trình bày chi tiết hơn, đặc biệt là cách thức thu thập và xử lý dữ liệu thực nghiệm.\n\n2. Cần làm rõ tính mới và điểm khác biệt so với các mô hình AI giáo dục hiện có trên thị trường quốc tế.\n\n3. Bổ sung kế hoạch triển khai thực nghiệm cụ thể với số lượng mẫu đủ lớn và có kiểm soát.",
  },
];

export const MOCK_MINUTES = {
  id: "BB-2026/HĐ-001",
  date: "16/02/2026",
  location: "Phòng Hội thảo A102, Trường Đại học Mở TP.HCM",
  council: [
    { name: "GS.TS Nguyễn Văn Khoa", title: "Chủ tịch Hội đồng" },
    { name: "PGS.TS Trần Thị Hương", title: "Phó Chủ tịch" },
    { name: "TS Lê Minh Đức", title: "Ủy viên phản biện 1" },
    { name: "TS Phạm Thành Long", title: "Ủy viên phản biện 2" },
    { name: "ThS Bùi Thị Kim Anh", title: "Thư ký Hội đồng" },
  ],
  scores: [
    { criteria: "Tính khoa học và tính mới", score: 8.5, max: 10 },
    { criteria: "Tính ứng dụng thực tiễn", score: 7.0, max: 10 },
    { criteria: "Tính khả thi của kế hoạch", score: 7.5, max: 10 },
    { criteria: "Năng lực nhóm nghiên cứu", score: 8.0, max: 10 },
    { criteria: "Dự toán kinh phí hợp lý", score: 8.0, max: 10 },
  ],
  summary: "Hội đồng ghi nhận đề tài có hướng nghiên cứu bám sát xu hướng công nghệ hiện đại và có ý nghĩa thực tiễn cao đối với lĩnh vực giáo dục đại học Việt Nam. Chủ nhiệm đề tài có năng lực và kinh nghiệm phù hợp.",
  decision: "Yêu cầu chỉnh sửa",
  decisionNote: "Đề nghị chủ nhiệm bổ sung phần phương pháp nghiên cứu và kế hoạch triển khai thực nghiệm trong vòng 15 ngày làm việc kể từ ngày nhận biên bản.",
};

// Hàm hỗ trợ tạo viết tắt tên
export const getInitials = (name) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};