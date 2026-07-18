// File: src/mocks/emailTemplateMock.js

export const ACADEMIC_TITLES = ["GS.TS", "PGS.TS", "TS", "ThS", "BS.CKII"];
export const COUNCIL_ROLES = ["Chủ tịch", "Thư ký", "Phản biện 1", "Phản biện 2", "Ủy viên"];

export const DEFAULT_VARS = {
  academicTitle: "GS.TS",
  fullName: "Nguyễn Văn An",
  topicName: "Nghiên cứu Hệ thống Trí tuệ Nhân tạo trong Hỗ trợ Chẩn đoán Y tế",
  meetingTime: "08:00 – 20/10/2026",
  meetingLocation: "Phòng Họp Trực tuyến A (Google Meet)",
  username: "expert.nguyenvanan@ou.edu.vn",
  temporaryPassword: "Ou@2026#Tmp!",
  councilRole: "Chủ tịch",
  loginUrl: "https://qlnckh.ou.edu.vn/login",
};

// Cấu hình giao diện (Theme) cho Email Body để sau này dễ chỉnh sửa chung
export const EMAIL_THEME = {
  BRAND: "#1a5ea8",
  BG_MAIN: "#F7F9FC",
};