// File: src/mocks/accountMock.js

export const ROLE_OPTIONS = ["Chuyên viên", "Trưởng phòng", "Phó phòng", "Giám đốc"];

export const CONFIRM_CONFIG = {
  lock: {
    title: "Xác nhận khoá tài khoản",
    description: "Bạn có chắc chắn muốn khoá quyền truy cập của tài khoản này không? Nhân viên sẽ không thể đăng nhập hệ thống cho đến khi được kích hoạt lại.",
    iconBg: "bg-amber-50",
    confirmLabel: "Khoá tài khoản",
    confirmCls: "bg-red-600 hover:bg-red-700",
  },
  activate: {
    title: "Xác nhận kích hoạt tài khoản",
    description: "Bạn có chắc chắn muốn kích hoạt lại tài khoản này không? Nhân viên sẽ được phép đăng nhập và sử dụng hệ thống.",
    iconBg: "bg-green-50",
    confirmLabel: "Kích hoạt",
    confirmCls: "bg-green-600 hover:bg-green-700",
  },
};

export const INITIAL_USERS = Array.from({ length: 13 }, (_, i) => ({
  id: i + 1,
  name: "Nguyễn Thị Hoài Thương",
  email: "2351010207thuong@ou.edu.vn",
  role: "Chuyên viên",
  status: i % 3 === 1 ? "locked" : "active",
}));

export const PAGE_SIZE = 5;
export const TABLE_HEADERS = ["Họ Tên", "Email công vụ", "Chức vụ", "Trạng thái", "Hành động"];