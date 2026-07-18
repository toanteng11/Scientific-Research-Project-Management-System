// File: src/mocks/topicRevisionMock.js

export const MOCK_TOPIC = {
    code: "DT001",
    title: "Nghiên cứu Hệ thống AI trong Hỗ trợ Chẩn đoán Y tế",
    titleEn: "Research on AI Systems for Medical Diagnosis Support",
    pi: "TS. Nguyễn Minh Khoa",
    unit: "Khoa Công nghệ Thông tin",
    council: "HĐ CNTT – 01/2026",
    meetingDate: "20/10/2026",
    submittedDate: "15/09/2026",
  };
  
  export const COUNCIL_FEEDBACK = {
    avgScore: 85.4,
    decision: "Thông qua có điều kiện",
    decisionSub: "Yêu cầu chỉnh sửa và nộp lại trong 30 ngày",
    reviewer: "GS.TS. Nguyễn Văn An (Chủ tịch HĐ)",
    deadline: "20/11/2026",
    items: [
      {
        id: 1,
        severity: "high",
        section: "Mục III – Rủi ro & Giới hạn",
        content: "Bổ sung phần đánh giá rủi ro chi tiết khi triển khai hệ thống AI vào môi trường y tế thực tế, bao gồm rủi ro về độ chính xác, bảo mật dữ liệu bệnh nhân và trách nhiệm pháp lý.",
      },
      {
        id: 2,
        severity: "high",
        section: "Mục II – Đối tượng & Phạm vi",
        content: "Làm rõ đối tượng nghiên cứu cụ thể: loại bệnh lý nào được ưu tiên, loại hình ảnh y tế nào (X-quang, MRI, CT) và phạm vi địa lý của cơ sở y tế hợp tác.",
      },
      {
        id: 3,
        severity: "medium",
        section: "Mục V – Dự toán Kinh phí",
        content: "Chi tiết hóa dự toán kinh phí theo từng hạng mục cụ thể. Một số hạng mục thiết bị được đánh giá cao hơn giá thị trường, cần rà soát và điều chỉnh cho phù hợp.",
      },
      {
        id: 4,
        severity: "medium",
        section: "Mục IV – Kế hoạch Triển khai",
        content: "Bổ sung kế hoạch thử nghiệm lâm sàng cụ thể, cơ chế phối hợp với các cơ sở y tế đối tác, và mốc kiểm tra tiến độ giữa kỳ (milestone).",
      },
      {
        id: 5,
        severity: "low",
        section: "Mục II – Mục tiêu cụ thể",
        content: "Bổ sung các chỉ số đo lường (KPI) rõ ràng và có thể kiểm chứng cho từng mục tiêu cụ thể để thuận tiện cho quá trình đánh giá nghiệm thu.",
      },
    ],
  };
  
  export const SEVERITY_CFG = {
    high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400", label: "Bắt buộc" },
    medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400", label: "Quan trọng" },
    low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400", label: "Khuyến nghị" },
  };
  
  export const INITIAL_FORM = {
    title: MOCK_TOPIC.title,
    titleEn: MOCK_TOPIC.titleEn,
    objectives: "Phát triển hệ thống AI có khả năng hỗ trợ chẩn đoán hình ảnh y tế (X-quang, MRI) với độ chính xác ≥ 90%. Xây dựng bộ dữ liệu hình ảnh y tế chuẩn hóa đủ lớn cho huấn luyện và kiểm định mô hình. Phát triển giao diện tích hợp thân thiện phục vụ bác sĩ lâm sàng.",
    scope: "Đối tượng: Hình ảnh y tế (X-quang phổi, MRI não) thu thập từ 2 bệnh viện đối tác tại TP.HCM trong giai đoạn 2026–2027. Phạm vi: Tập trung vào 3 loại bệnh lý phổ biến nhất trong bộ dữ liệu hợp tác.",
    methods: "Sử dụng các kiến trúc mạng neural tích chập (CNN) tiên tiến: ResNet-50, EfficientNet-B4, Vision Transformer. Áp dụng kỹ thuật Transfer Learning và Data Augmentation để tối ưu với bộ dữ liệu y tế hạn chế. Đánh giá mô hình bằng AUC-ROC, Sensitivity, Specificity.",
    products: "01 Bài báo khoa học trên tạp chí quốc tế Q2+. 01 Phần mềm hỗ trợ chẩn đoán được cấp ĐKBQ. 01 Báo cáo kết quả toàn diện.",
  };