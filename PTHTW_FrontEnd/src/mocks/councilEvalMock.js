// File: src/mocks/councilEvalMock.js

export const MOCK_TOPIC = {
    code: "DT001",
    title: "Nghiên cứu Hệ thống AI trong Hỗ trợ Chẩn đoán Y tế",
    pi: "Nguyễn Thị Hoa",
    council: "HĐ CNTT – 01/2026",
    evaluatorRole: "Phản biện 1",
    evaluatorName: "GS.TS. Nguyễn Văn An",
    evaluatorUnit: "ĐH Khoa học Tự nhiên TP.HCM",
    date: "20/03/2026 14:00",
    location: "Phòng B.306",
  };
  
  export const CRITERIA = [
    {
      id: 1,
      num: "I",
      title: "Tính cấp thiết",
      maxScore: 15,
      description: "Tính cấp thiết, tầm quan trọng và ý nghĩa thực tiễn của đề tài đối với khoa học và xã hội.",
    },
    {
      id: 2,
      num: "II",
      title: "Mục tiêu và Nội dung",
      maxScore: 30,
      description: "Sự rõ ràng, tính bao quát và tính khả thi của mục tiêu và đầy đủ các nội dung nghiên cứu.",
    },
    {
      id: 3,
      num: "III",
      title: "Phương pháp Nghiên cứu",
      maxScore: 15,
      description: "Sự phù hợp và tính khoa học của phương pháp nghiên cứu và cách tiếp cận đề tài.",
    },
    {
      id: 4,
      num: "IV",
      title: "Tính khả thi và Hiệu quả",
      maxScore: 10,
      description: "Khả năng thực hiện, nguồn lực và hiệu quả mong đợi của đề tài trong điều kiện thực tế.",
    },
    {
      id: 5,
      num: "V",
      title: "Năng lực Nhóm nghiên cứu",
      maxScore: 10,
      description: "Kinh nghiệm, chuyên môn và điều kiện vật chất-kỹ thuật của nhóm nghiên cứu.",
    },
    {
      id: 6,
      num: "VI",
      title: "Sản phẩm Khoa học",
      maxScore: 20,
      description: "Các sản phẩm dự kiến: bài báo khoa học, công nghệ, giải pháp và khả năng chuyển giao.",
    },
  ];
  
  export const MAX_TOTAL = CRITERIA.reduce((s, c) => s + c.maxScore, 0); // 100
  
  export const GRADE_OPTIONS = [
    { value: "", label: "Chọn mức xếp loại..." },
    { value: "excellent", label: "Xuất sắc (≥ 90 điểm)" },
    { value: "good", label: "Khá (80 – 89 điểm)" },
    { value: "pass", label: "Đạt (70 – 79 điểm)" },
    { value: "fail", label: "Không đạt (< 70 điểm)" },
  ];
  
  export const GRADE_CFG = {
    excellent: { style: "bg-green-100 text-green-800 border-green-300", short: "Xuất sắc" },
    good: { style: "bg-blue-100  text-blue-800  border-blue-300", short: "Khá" },
    pass: { style: "bg-yellow-100 text-yellow-800 border-yellow-300", short: "Đạt" },
    fail: { style: "bg-red-100   text-red-800   border-red-300", short: "Không đạt" },
  };
  
  // Hàm tính toán xếp loại tự động (Được bóc tách ra để dễ viết Unit Test)
  export const suggestGrade = (total) => {
    if (total >= 90) return "excellent";
    if (total >= 80) return "good";
    if (total >= 70) return "pass";
    return "fail";
  };
  
  // Hàm khởi tạo State điểm số ban đầu
  export const mkScores = () =>
    Object.fromEntries(CRITERIA.map((c) => [c.id, { score: "", comment: "" }]));