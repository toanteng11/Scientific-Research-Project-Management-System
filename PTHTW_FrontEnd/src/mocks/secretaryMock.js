// File: src/mocks/secretaryMock.js

export const SECRETARY = {
    name: "PGS.TS. Trần Thị Bình",
    initials: "TB",
    role: "Thư ký Hội đồng",
    avatarGrad: "from-blue-600 to-blue-800",
  };
  
  export const MOCK_MEETING = {
    topicCode: "DT001",
    topicTitle: "Nghiên cứu Hệ thống AI trong Hỗ trợ Chẩn đoán Y tế",
    council: "HĐ CNTT – 01/2026",
    datetime: "08:00 – 20/10/2026",
    location: "Phòng Họp Trực tuyến A",
  };
  
  export const ROLE_CFG = {
    "Chủ tịch": { bg: "bg-rose-800", text: "text-white", pill: "bg-rose-50 text-rose-800 border-rose-200" },
    "Thư ký": { bg: "bg-blue-800", text: "text-white", pill: "bg-blue-50 text-blue-800 border-blue-200" },
    "Phản biện 1": { bg: "bg-orange-500", text: "text-white", pill: "bg-orange-50 text-orange-700 border-orange-200" },
    "Phản biện 2": { bg: "bg-amber-500", text: "text-white", pill: "bg-amber-50 text-amber-700 border-amber-200" },
    "Ủy viên": { bg: "bg-gray-500", text: "text-white", pill: "bg-gray-50 text-gray-600 border-gray-200" },
  };
  
  export const DASHBOARD_STATUS_CFG = {
    IN_PROGRESS: { label: "Đang tiến hành", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-400" },
    READY: { label: "Chờ lập biên bản", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400" },
    MINUTES_CREATED: { label: "Đã có Biên bản", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-400" },
  };
  
  export const INITIAL_MEMBERS = [
    { id: 1, name: "GS.TS. Nguyễn Văn An", role: "Chủ tịch", status: "done", isSelf: false, initials: "NA", avatarGrad: "from-rose-500 to-rose-700" },
    { id: 2, name: "PGS.TS. Trần Thị Bình", role: "Thư ký", status: "pending", isSelf: true, initials: "TB", avatarGrad: "from-blue-500 to-blue-700" },
    { id: 3, name: "TS. Lê Minh Cường", role: "Phản biện 1", status: "done", isSelf: false, initials: "LC", avatarGrad: "from-orange-400 to-orange-600" },
    { id: 4, name: "GS.TS. Phạm Quốc Dũng", role: "Phản biện 2", status: "pending", isSelf: false, initials: "PD", avatarGrad: "from-amber-400 to-amber-600" },
    { id: 5, name: "TS. Hoàng Thị Oanh", role: "Ủy viên", status: "pending", isSelf: false, initials: "HO", avatarGrad: "from-gray-400 to-gray-500" },
  ];