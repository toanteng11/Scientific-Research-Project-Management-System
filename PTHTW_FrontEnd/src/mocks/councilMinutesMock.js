// File: src/mocks/councilMinutesMock.js

export const MOCK_TOPIC = {
    code: "DT001",
    title: "Nghiên cứu Hệ thống AI trong Hỗ trợ Chẩn đoán Y tế",
    pi: "TS. Nguyễn Minh Khoa",
    unit: "Khoa Công nghệ Thông tin",
    field: "Khoa học Máy tính / AI",
    duration: "24 tháng",
    startDate: "01/01/2026",
    council: "HĐ CNTT – 01/2026",
    abstract:
      "Đề tài nhằm nghiên cứu và phát triển một hệ thống trí tuệ nhân tạo (AI) có khả năng hỗ trợ các bác sĩ trong quá trình chẩn đoán bệnh thông qua việc phân tích hình ảnh y tế (X-quang, MRI, CT scan). Hệ thống sử dụng các mô hình học sâu (Deep Learning) kết hợp với kỹ thuật xử lý ảnh số để phát hiện các bất thường và đưa ra gợi ý chẩn đoán với độ chính xác cao, góp phần nâng cao chất lượng chăm sóc sức khỏe cộng đồng.",
    objectives: [
      "Xây dựng bộ dữ liệu hình ảnh y tế chuẩn hóa phục vụ huấn luyện mô hình AI.",
      "Nghiên cứu và cải tiến các kiến trúc mạng neural tích chập (CNN) phù hợp với bài toán chẩn đoán hình ảnh.",
      "Phát triển giao diện tích hợp hỗ trợ bác sĩ tra cứu và phản hồi kết quả AI.",
      "Đánh giá hiệu quả hệ thống trên bộ dữ liệu thực tế tại cơ sở y tế hợp tác.",
    ],
    products: [
      "01 Bài báo khoa học đăng trên tạp chí quốc tế (Q2 trở lên)",
      "01 Phần mềm hỗ trợ chẩn đoán y tế có giấy chứng nhận ĐKBQ",
      "01 Báo cáo kết quả nghiên cứu toàn diện",
    ],
  };
  
  export const ROLE_CFG = {
    "Chủ tịch": { avatarGrad: "from-rose-500 to-rose-700", pill: "bg-rose-50 text-rose-800 border-rose-200" },
    "Thư ký": { avatarGrad: "from-blue-500 to-blue-700", pill: "bg-blue-50 text-blue-800 border-blue-200" },
    "Phản biện 1": { avatarGrad: "from-orange-400 to-orange-600", pill: "bg-orange-50 text-orange-700 border-orange-200" },
    "Phản biện 2": { avatarGrad: "from-amber-400 to-amber-600", pill: "bg-amber-50 text-amber-700 border-amber-200" },
    "Ủy viên": { avatarGrad: "from-gray-400 to-gray-500", pill: "bg-gray-50 text-gray-600 border-gray-200" },
  };
  
  export const MOCK_MEMBERS = [
    {
      id: 1,
      name: "GS.TS. Nguyễn Văn An",
      role: "Chủ tịch",
      initials: "NA",
      score: 88,
      comment:
        "Đề tài có tính khoa học cao và tính thực tiễn rõ ràng. Phương pháp nghiên cứu phù hợp với mục tiêu đặt ra. Nhóm nghiên cứu có năng lực tốt. Đề nghị bổ sung thêm phần đánh giá rủi ro trong quá trình triển khai hệ thống AI vào môi trường y tế thực tế.",
    },
    {
      id: 2,
      name: "PGS.TS. Trần Thị Bình",
      role: "Thư ký",
      initials: "TB",
      score: 84,
      comment:
        "Tổng quan tài liệu đầy đủ và có chiều sâu. Cần bổ sung rõ hơn phần mục tiêu cụ thể và chỉ số đo lường (KPI) để thuận tiện cho đánh giá nghiệm thu. Dự toán kinh phí cần được chi tiết hóa ở một số hạng mục còn mờ.",
    },
    {
      id: 3,
      name: "TS. Lê Minh Cường",
      role: "Phản biện 1",
      initials: "LC",
      score: 87,
      comment:
        "Phương pháp nghiên cứu hợp lý và có cơ sở khoa học. Đề nghị nhóm làm rõ hơn về đối tượng nghiên cứu cụ thể (loại bệnh, loại hình ảnh y tế nào được ưu tiên). Phần sản phẩm dự kiến cần bổ sung thêm kế hoạch thương mại hóa hoặc chuyển giao công nghệ.",
    },
    {
      id: 4,
      name: "GS.TS. Phạm Quốc Dũng",
      role: "Phản biện 2",
      initials: "PD",
      score: 82,
      comment:
        "Nhóm nghiên cứu có năng lực và kinh nghiệm tốt trong lĩnh vực AI. Tuy nhiên, kinh phí dự toán một số hạng mục thiết bị còn cao so với thực tế thị trường. Đề nghị rà soát và điều chỉnh cho phù hợp trước khi phê duyệt chính thức.",
    },
    {
      id: 5,
      name: "TS. Hoàng Thị Oanh",
      role: "Ủy viên",
      initials: "HO",
      score: 86,
      comment:
        "Sản phẩm đầu ra được xác định rõ ràng và có tính khả thi. Đề nghị bổ sung kế hoạch triển khai thử nghiệm lâm sàng và cơ chế phối hợp với các cơ sở y tế đối tác. Cần có mốc kiểm tra tiến độ giữa kỳ rõ ràng hơn.",
    },
  ];
  
  export const AVG_SCORE = +(MOCK_MEMBERS.reduce((s, m) => s + m.score, 0) / MOCK_MEMBERS.length).toFixed(1);
  export const MAX_SCORE = Math.max(...MOCK_MEMBERS.map((m) => m.score));
  export const MIN_SCORE = Math.min(...MOCK_MEMBERS.map((m) => m.score));
  
  export const scoreGrade = (avg) => {
    if (avg >= 90) return { label: "XUẤT SẮC", bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-500" };
    if (avg >= 80) return { label: "KHÁ / ĐẠT", bg: "bg-green-100", text: "text-green-800", bar: "bg-green-500" };
    if (avg >= 70) return { label: "ĐẠT", bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500" };
    return { label: "KHÔNG ĐẠT", bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500" };
  };
  
  export const buildAutoFetch = () =>
    `TỔNG HỢP Ý KIẾN THÀNH VIÊN HỘI ĐỒNG\nĐề tài: ${MOCK_TOPIC.code} – ${MOCK_TOPIC.title}\n` +
    `Ngày họp: 20/10/2026 | Hội đồng: ${MOCK_TOPIC.council}\n\n` +
    MOCK_MEMBERS.map((m) => `▸ ${m.name} (${m.role}) – Điểm: ${m.score}/100\n   ${m.comment}`).join("\n\n") +
    `\n\n─────────────────────────────────────────────\nĐiểm trung bình của Hội đồng: ${AVG_SCORE}/100\nKết quả đánh giá tổng thể: ${scoreGrade(AVG_SCORE).label}\n─────────────────────────────────────────────`;
  
  // Lưu ý: DECISION_OPTIONS vẫn chứa JSX Icons, nên để nó ở file .jsx hoặc import Icons vào file mock nếu muốn tách biệt hoàn toàn.
  // Ở đây tôi giữ lại các phần config không chứa JSX Icon để code gọn gàng nhất.
  export const DECISION_CONFIG = [
    {
      id: "approved",
      title: "Đồng ý thông qua",
      subtitle: "Không yêu cầu chỉnh sửa",
      accent: {
        border: "border-green-500", bg: "bg-green-50", text: "text-green-800",
        sub: "text-green-600", ring: "ring-2 ring-green-200", iconBg: "bg-green-100 text-green-600",
        badge: "bg-green-100 text-green-700",
      },
    },
    {
      id: "conditional",
      title: "Thông qua có điều kiện",
      subtitle: "Yêu cầu chỉnh sửa theo góp ý của Hội đồng",
      accent: {
        border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-900",
        sub: "text-amber-700", ring: "ring-2 ring-amber-200", iconBg: "bg-amber-100 text-amber-600",
        badge: "bg-amber-100 text-amber-700",
      },
    },
    {
      id: "rejected",
      title: "Không thông qua",
      subtitle: "Yêu cầu bảo vệ lại ở phiên tiếp theo",
      accent: {
        border: "border-red-500", bg: "bg-red-50", text: "text-red-900",
        sub: "text-red-600", ring: "ring-2 ring-red-200", iconBg: "bg-red-100 text-red-600",
        badge: "bg-red-100 text-red-700",
      },
    },
  ];