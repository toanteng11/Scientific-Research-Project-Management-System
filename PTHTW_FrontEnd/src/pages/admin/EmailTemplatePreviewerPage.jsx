// File: src/pages/admin/EmailTemplatePreviewerPage.jsx

import { useState } from "react";
import useUiStore from "../../store/uiStore";
// Assumes you have your OU logo at this path relative to this file
import logoOU from "../../assets/ADMIN/logo-ou.svg";

// ─── Constants & Mocks (Inlined for standalone functionality) ────────────────────
const ACADEMIC_TITLES = [
  "GS.TS",
  "PGS.TS",
  "TS",
  "ThS",
  "ThS.BS",
  "BS.CKII",
  "Kỹ sư",
  "Cử nhân",
  "Chuyên gia",
  "Ông",
  "Bà"
];

const COUNCIL_ROLES = [
  "Chủ tịch",
  "Thư ký",
  "Phản biện 1",
  "Phản biện 2",
  "Ủy viên"
];

const DEFAULT_VARS = {
  academicTitle: "GS.TS",
  fullName: "Nguyễn Văn An",
  topicName: "Nghiên cứu Hệ thống Trí tuệ Nhân tạo trong Hỗ trợ Chẩn đoán Y tế",
  meetingTime: "08:00 – 20/10/2026",
  meetingLocation: "Phòng Họp Trực tuyến A (Google Meet)",
  councilRole: "Chủ tịch",
  username: "expert.nguyenvanan@ou.edu.vn",
  temporaryPassword: "PwdOU2026!@#",
  loginUrl: "https://qldt.ou.edu.vn/login?token=xyz123abc456"
};

const EMAIL_THEME = {
  BRAND: "#1a5ea8",
  BG_MAIN: "#f8fafc",
  TEXT_DARK: "#1e293b",
  TEXT_MUTED: "#475569",
};


// ─── SVG Factory ─────────────────────────────────────────────────────────────────

const Svg = ({ d, cls = "w-5 h-5", sw = 2 }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const IcMail     = p => <Svg {...p} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
const IcCheck    = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcEye      = p => <Svg {...p} d={["M15 12a3 3 0 11-6 0 3 3 0 016 0z","M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"]} />;
const IcSend     = p => <Svg {...p} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
const IcUser     = p => <Svg {...p} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
const IcCalendar = p => <Svg {...p} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const IcKey      = p => <Svg {...p} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />;
const IcLink     = p => <Svg {...p} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />;
const IcInfo     = p => <Svg {...p} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IcRefresh  = p => <Svg {...p} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;
const IcChevDown = p => <Svg {...p} d="M19 9l-7 7-7-7" />;

// ─── Left Panel: Control Form ─────────────────────────────────────────────────────

const FormGroup = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-none">{label}</label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="h-9 rounded-lg border border-gray-200 bg-white text-[12.5px] text-gray-700 px-3 outline-none focus:border-[#1a5ea8] focus:ring-2 focus:ring-[#1a5ea8]/20 transition placeholder:text-gray-300"
  />
);

const SelectInput = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 rounded-lg border border-gray-200 bg-white text-[12.5px] text-gray-700 px-3 pr-8 outline-none focus:border-[#1a5ea8] focus:ring-2 focus:ring-[#1a5ea8]/20 transition appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <IcChevDown cls="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

const SectionHeader = ({ icon, title, color = "text-gray-500", bg = "bg-gray-100" }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg} mt-1`}>
    <span className={color}>{icon}</span>
    <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{title}</span>
  </div>
);

const ControlPanel = ({ vars, setVar, onSendTest }) => (
  <div className="flex flex-col h-full overflow-y-auto bg-white border-r border-gray-200">
    {/* Panel header */}
    <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 sticky top-0 bg-white z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#c5e2f5] flex items-center justify-center">
          <IcInfo cls="w-4 h-4 text-[#1a5ea8]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-900 leading-tight">Biến động thư</p>
          <p className="text-[10px] text-gray-400 font-medium">Chỉnh sửa để xem trực tiếp</p>
        </div>
      </div>
    </div>

    {/* Form fields */}
    <div className="px-5 py-4 flex flex-col gap-4 flex-1">

      <SectionHeader
        icon={<IcUser cls="w-3.5 h-3.5" />}
        title="Người nhận"
        color="text-[#1a5ea8]"
        bg="bg-[#eaf5fc]"
      />
      <FormGroup label="Học hàm / Học vị">
        <SelectInput value={vars.academicTitle} onChange={v => setVar("academicTitle", v)} options={ACADEMIC_TITLES} />
      </FormGroup>
      <FormGroup label="Họ và tên">
        <TextInput value={vars.fullName} onChange={v => setVar("fullName", v)} placeholder="Ví dụ: Nguyễn Văn An" />
      </FormGroup>

      <SectionHeader
        icon={<IcCalendar cls="w-3.5 h-3.5" />}
        title="Thông tin Phiên họp"
        color="text-amber-700"
        bg="bg-amber-50"
      />
      <FormGroup label="Tên đề tài">
        <TextInput value={vars.topicName} onChange={v => setVar("topicName", v)} placeholder="Tên đề tài nghiên cứu" />
      </FormGroup>
      <FormGroup label="Thời gian dự kiến">
        <TextInput value={vars.meetingTime} onChange={v => setVar("meetingTime", v)} placeholder="VD: 08:00 – 20/10/2026" />
      </FormGroup>
      <FormGroup label="Địa điểm / Nền tảng">
        <TextInput value={vars.meetingLocation} onChange={v => setVar("meetingLocation", v)} placeholder="VD: Phòng họp A / Zoom" />
      </FormGroup>

      <SectionHeader
        icon={<IcKey cls="w-3.5 h-3.5" />}
        title="Thông tin Tài khoản"
        color="text-green-700"
        bg="bg-green-50"
      />
      <FormGroup label="Vai trò Hội đồng">
        <SelectInput value={vars.councilRole} onChange={v => setVar("councilRole", v)} options={COUNCIL_ROLES} />
      </FormGroup>
      <FormGroup label="Tên đăng nhập (email)">
        <TextInput value={vars.username} onChange={v => setVar("username", v)} placeholder="expert@ou.edu.vn" />
      </FormGroup>
      <FormGroup label="Mật khẩu tạm thời">
        <TextInput value={vars.temporaryPassword} onChange={v => setVar("temporaryPassword", v)} placeholder="Mật khẩu hệ thống cấp" />
      </FormGroup>

      <SectionHeader
        icon={<IcLink cls="w-3.5 h-3.5" />}
        title="Hệ thống"
        color="text-purple-700"
        bg="bg-purple-50"
      />
      <FormGroup label="URL đăng nhập">
        <TextInput value={vars.loginUrl} onChange={v => setVar("loginUrl", v)} placeholder="https://..." />
      </FormGroup>

      {/* Variable legend */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5 mt-1">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Biến đang dùng</p>
        <div className="flex flex-col gap-1">
          {Object.keys(DEFAULT_VARS).map(key => (
            <div key={key} className="flex items-center gap-2 text-[10.5px]">
              <code className="bg-blue-50 text-[#1a5ea8] px-1.5 py-0.5 rounded font-mono font-bold">{`{${key}}`}</code>
              <span className="text-gray-400">→</span>
              <span className="text-gray-600 truncate font-medium">{DEFAULT_VARS[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Footer actions */}
    <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0 sticky bottom-0 bg-white">
      <button
        onClick={onSendTest}
        className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-[#1a5ea8] hover:bg-[#15306a] text-white text-[12.5px] font-bold transition shadow-sm"
      >
        <IcSend cls="w-4 h-4" />
        Gửi email test
      </button>
      <p className="text-[10px] text-gray-400 text-center font-medium">
        Email thử nghiệm sẽ được gửi đến địa chỉ trong biến <code className="bg-gray-100 px-1 rounded">{"{username}"}</code>
      </p>
    </div>
  </div>
);

// ─── Right Panel: Email Preview ───────────────────────────────────────────────────

// Simulates the "meta" header of an email client (From/To/Subject bar)
const EmailClientChrome = ({ vars }) => (
  <div className="bg-white border border-gray-200 rounded-t-xl shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-[11px] text-gray-500 font-mono">
        Email Preview — SYS-MAIL-01
      </div>
      <IcEye cls="w-4 h-4 text-gray-400" />
    </div>
    <div className="px-4 py-3 flex flex-col gap-1.5 text-[11.5px] text-gray-600 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="w-12 font-bold text-gray-400 text-right flex-shrink-0">Từ:</span>
        <span className="font-semibold text-gray-700">Phòng QLKH OU <span className="font-normal text-gray-400">&lt;noreply@qlnckh.ou.edu.vn&gt;</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 font-bold text-gray-400 text-right flex-shrink-0">Đến:</span>
        <span className="text-gray-700 font-semibold">{vars.username || "—"}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 font-bold text-gray-400 text-right flex-shrink-0">Tiêu đề:</span>
        <span className="text-gray-800 font-bold">
          [QLKH-OU] Thư mời tham gia Hội đồng Xét duyệt – {vars.topicName ? vars.topicName.substring(0, 40) + (vars.topicName.length > 40 ? "..." : "") : "—"}
        </span>
      </div>
    </div>
  </div>
);

// The actual 600px-width email body
const EmailBody = ({ vars }) => {
  const { BRAND, BG_MAIN } = EMAIL_THEME;

  return (
    <div style={{ backgroundColor: BG_MAIN, padding: "24px 0", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* ── Email Header ── */}
        <div style={{ backgroundColor: BRAND, padding: "28px 40px 24px", textAlign: "center" }}>
          {/* Use standard img tag since Next.js Image component isn't available here */}
          <img src={logoOU} alt="OU Logo" style={{ height: 52, marginBottom: 14, filter: "brightness(0) invert(1)" }} />
          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", margin: "0 0 14px" }} />
          <h1 style={{ color: "#ffffff", fontSize: 17, fontWeight: 800, margin: 0, lineHeight: 1.4 }}>
            Thư mời tham gia Hội đồng Xét duyệt
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "6px 0 0", fontWeight: 500 }}>
            Đề tài Nghiên cứu Khoa học cấp Cơ sở
          </p>
        </div>

        {/* ── Accent stripe ── */}
        <div style={{ height: 4, background: "linear-gradient(to right, #1a5ea8, #38bdf8, #1a5ea8)" }} />

        {/* ── Email Body ── */}
        <div style={{ padding: "32px 40px" }}>

          {/* Greeting */}
          <p style={{ fontSize: 15, color: "#1e293b", marginBottom: 10, fontWeight: 400 }}>
            Kính gửi{" "}
            <strong style={{ color: BRAND, fontWeight: 700 }}>
              {vars.academicTitle} {vars.fullName || "…"}
            </strong>
            ,
          </p>

          {/* Introduction */}
          <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.75, marginBottom: 20 }}>
            Phòng Quản lý Khoa học trân trọng kính mời Ông/Bà tham gia{" "}
            <strong style={{ color: "#1e293b" }}>Hội đồng Xét duyệt</strong> cho đề tài nghiên cứu khoa học cấp cơ sở của Trường Đại học Mở TP.HCM. Chi tiết phiên họp như sau:
          </p>

          {/* ── Meeting Context Box ── */}
          <div style={{ borderLeft: `4px solid ${BRAND}`, backgroundColor: "#EFF6FF", borderRadius: "0 8px 8px 0", padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              📋 Chi tiết Phiên họp
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Tên đề tài",             vars.topicName       || "—"],
                  ["Thời gian dự kiến",      vars.meetingTime     || "—"],
                  ["Địa điểm / Nền tảng",   vars.meetingLocation || "—"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ verticalAlign: "top" }}>
                    <td style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", paddingRight: 12, paddingBottom: 6, whiteSpace: "nowrap", width: 1 }}>
                      {label}:
                    </td>
                    <td style={{ fontSize: 12.5, color: "#1e293b", fontWeight: 500, paddingBottom: 6 }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Account Credentials Box ── */}
          <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              🔐 Thông tin Tài khoản Hệ thống
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Vai trò",           vars.councilRole       || "—"],
                  ["Tên đăng nhập",     vars.username          || "—"],
                  ["Mật khẩu tạm",     vars.temporaryPassword || "—"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ fontSize: 12.5, fontWeight: 600, color: "#64748B", padding: "7px 0", paddingRight: 16, whiteSpace: "nowrap", width: 1 }}>
                      {label}:
                    </td>
                    <td style={{ fontSize: 12.5, color: "#0F172A", fontWeight: label === "Mật khẩu tạm" ? 800 : 600, padding: "7px 0", fontFamily: label === "Mật khẩu tạm" ? "monospace" : "inherit" }}>
                      {label === "Vai trò"
                        ? <span style={{ backgroundColor: "#EFF6FF", color: BRAND, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{value}</span>
                        : value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Security warning */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #E2E8F0", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <p style={{ fontSize: 12, color: "#DC2626", fontStyle: "italic", lineHeight: 1.65, margin: 0 }}>
                <strong>Lưu ý bảo mật:</strong> Đây là mật khẩu cấp một lần. Hệ thống sẽ yêu cầu Ông/Bà đổi mật khẩu ngay trong lần đăng nhập đầu tiên để đảm bảo an toàn thông tin.
              </p>
            </div>
          </div>

          {/* ── Call-To-Action ── */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <a
              href={vars.loginUrl}
              style={{
                display: "inline-block",
                backgroundColor: BRAND,
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
                padding: "14px 36px",
                borderRadius: 8,
                letterSpacing: "0.01em",
              }}
            >
              🚀 Truy cập Hệ thống để Xét duyệt
            </a>
          </div>

          {/* Fallback URL */}
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "0 0 4px", fontStyle: "italic" }}>
              Nếu nút bấm không hoạt động, vui lòng copy và dán đường dẫn sau vào trình duyệt của bạn:
            </p>
            <a
              href={vars.loginUrl}
              style={{ fontSize: 12, color: BRAND, wordBreak: "break-all", fontWeight: 600 }}
            >
              {vars.loginUrl || "—"}
            </a>
          </div>

          {/* Closing */}
          <p style={{ fontSize: 13, color: "#475569", marginTop: 20, lineHeight: 1.75 }}>
            Trân trọng kính chào,<br />
            <strong style={{ color: "#1e293b" }}>Phòng Quản lý Khoa học</strong><br />
            <span style={{ fontSize: 12, color: "#94A3B8" }}>Trường Đại học Mở TP.HCM (OU)</span>
          </p>
        </div>

        {/* ── Email Footer ── */}
        <div style={{ backgroundColor: "#F1F5F9", borderTop: "1px solid #E2E8F0", padding: "20px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 6px", fontWeight: 600 }}>
            Phòng Quản lý Khoa học – Trường Đại học Mở TP.HCM
          </p>
          <p style={{ fontSize: 11, color: "#CBD5E1", margin: 0, fontStyle: "italic" }}>
            Đây là email được gửi tự động từ hệ thống. Vui lòng không trả lời email này.
          </p>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 12 }}>
            {["Chính sách bảo mật", "Liên hệ hỗ trợ", "Hủy nhận thông báo"].map(link => (
              <a key={link} href="#" style={{ fontSize: 10.5, color: "#94A3B8", textDecoration: "underline" }}>{link}</a>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 10 }}>
            © 2026 Trường Đại học Mở TP.HCM · SYS-MAIL-01
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Preview Panel ────────────────────────────────────────────────────────────────

const PreviewPanel = ({ vars }) => (
  <div className="flex flex-col h-full overflow-hidden bg-gray-100">
    {/* Panel header */}
    <div className="px-6 py-3.5 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-sm relative">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#c5e2f5] flex items-center justify-center">
          <IcEye cls="w-4 h-4 text-[#1a5ea8]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-900 leading-tight">Xem trước Email</p>
          <p className="text-[10px] text-gray-400 font-medium">Cập nhật theo thời gian thực</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live Preview
        </span>
        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
          600px max-width
        </span>
      </div>
    </div>

    {/* Scrollable email preview area */}
    <div className="flex-1 overflow-y-auto">
      {/* Email client chrome frame */}
      <div className="px-6 pt-5 pb-0 max-w-4xl mx-auto">
        <EmailClientChrome vars={vars} />
      </div>
      {/* Actual email body */}
      <div className="px-6 pb-8 max-w-4xl mx-auto">
        <EmailBody vars={vars} />
      </div>
    </div>
  </div>
);

// ─── Main Exported Component ──────────────────────────────────────────────────

export default function EmailTemplatePreviewerPage() {
  const [vars,  setVars]  = useState(DEFAULT_VARS);
  const addToast = useUiStore((s) => s.addToast);

  const setVar = (key, val) => setVars(p => ({ ...p, [key]: val }));

  const handleReset = () => setVars(DEFAULT_VARS);

  const handleSendTest = () => {
    addToast({
      type: 'success',
      message: `Đã gửi email test thành công đến ${vars.username || "địa chỉ mặc định"}!`,
      duration: 3500,
    });
  };

  return (
    // Outer container fills the height of AppShell minus navbar (approx 100vh - 4rem/64px)
    // Using min-h-0 ensures nested flex children can scroll properly
    <div className="-m-6 flex flex-col h-[calc(100vh-4rem)] bg-gray-100 border-l border-gray-200">
      
      {/* ── App Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 px-6 py-3.5 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <img src={logoOU} alt="OU Logo" className="h-8 w-auto object-contain flex-shrink-0" />
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SYS-MAIL-01</p>
            <h1 className="text-[14px] font-bold text-gray-900 leading-tight">System Email Template Previewer</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#1a5ea8] bg-[#eaf5fc] border border-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <IcMail cls="w-3 h-3" />
            Template: Thư mời Hội đồng
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 transition"
          >
            <IcRefresh cls="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* ── Main layout: Left (30%) + Right (70%) ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Control panel */}
        <div className="w-[30%] min-w-[280px] max-w-[380px] flex-shrink-0 flex flex-col overflow-hidden shadow-sm z-10 relative">
          <ControlPanel vars={vars} setVar={setVar} onSendTest={handleSendTest} />
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
          <PreviewPanel vars={vars} />
        </div>
      </div>
    </div>
  );
}