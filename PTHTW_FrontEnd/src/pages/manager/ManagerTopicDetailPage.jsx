import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as RadioGroup from '@radix-ui/react-radio-group';

import { topicsApi } from '../../api/topics.api';
import { councilsApi } from '../../api/councils.api';
import { usersApi } from '../../api/users.api';
import useUiStore from '../../store/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PdfPreview from '../../components/ui/PdfPreview';
import RichTextDisplay from '../../components/ui/RichTextDisplay';
import { formatVND, formatDateTime } from '../../utils/formatters';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';

const Svg = ({ d, cls = "w-5 h-5", sw = 2, fill = "none" }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);
const IcLeft = p => <Svg {...p} d="M10 19l-7-7m0 0l7-7m-7 7h18" />;
const IcDoc = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcCheck = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcX = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;
const IcAlert = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcPlus = p => <Svg {...p} d="M12 4v16m8-8H4" />;
const IcUsers = p => <Svg {...p} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />;

const SCIENCE_SECTIONS = [
  { key: 'urgencyStatement', label: 'Tính cấp thiết' },
  { key: 'generalObjective', label: 'Mục tiêu tổng quát' },
  { key: 'specificObjectives', label: 'Mục tiêu cụ thể' },
  { key: 'researchMethods', label: 'Phương pháp nghiên cứu' },
  { key: 'researchScope', label: 'Phạm vi nghiên cứu' },
  { key: 'expectedProducts', label: 'Sản phẩm dự kiến' },
  { key: 'expectedImpacts', label: 'Hiệu quả kỳ vọng' },
];

const LeftPaneMetadataView = ({ topic }) => (
  <div className="h-full overflow-y-auto bg-gray-50 p-4 space-y-4">
    <div className="rounded-xl border border-indigo-100 bg-white p-4">
      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Mã đề tài</p>
      <p className="text-sm font-bold text-[#1a5ea8] mt-1">{topic?.topicCode || '—'}</p>
      <p className="text-[13px] font-bold text-gray-900 mt-2">{topic?.titleVn || '—'}</p>
      {topic?.titleEn && <p className="text-xs text-gray-500 mt-1">{topic.titleEn}</p>}
    </div>

    {SCIENCE_SECTIONS.map((section) => (
      topic?.[section.key] ? (
        <section key={section.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[11px] font-bold text-gray-700">{section.label}</p>
          </div>
          <div className="px-4 py-3 prose prose-sm max-w-none">
            <RichTextDisplay html={topic[section.key]} />
          </div>
        </section>
      ) : null
    ))}
  </div>
);

export default function ManagerTopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  
  const [topic, setTopic] = useState(null);
  const [councils, setCouncils] = useState([]);
  const [experts, setExperts] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcedureValid, setIsProcedureValid] = useState(false);
  const [assignMode, setAssignMode] = useState('EXISTING'); 
  const [selectedCouncil, setSelectedCouncil] = useState('');
  const [leftPaneMode, setLeftPaneMode] = useState('PDF');

  const { register: regReject, handleSubmit: handleRejectSubmit, watch: watchReject, formState: { errors: errReject } } = useForm();
  const { register: regCouncil, handleSubmit: handleCreateCouncilSubmit } = useForm();
  const feedbackMessage = watchReject('feedbackMessage');
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let objectUrl;
    
    const loadData = async () => {
      setLoading(true); 
      let fetchedTopic = null;
      
      // Khối 1: Tải Đề tài
      try {
        const topicRes = await topicsApi.getById(topicId);
        fetchedTopic = topicRes.data;
        setTopic(fetchedTopic);
      } catch (err) { 
        console.error("Lỗi khi tải dữ liệu đề tài:", err);
        setLoading(false);
        return; 
      }

      // Khối 2: Tải PDF
      const atts = fetchedTopic?.attachments ?? [];
      if (atts.length > 0) {
        try {
          const blobRes = await topicsApi.downloadAttachment(topicId, atts[0].attachmentId);
          objectUrl = URL.createObjectURL(blobRes.data);
          setPdfUrl(objectUrl);
        } catch (pdfErr) {
          console.error("Lỗi khi tải file PDF:", pdfErr);
        }
      }

      // Khối 3: Tải Dữ liệu Phân công
      if (fetchedTopic?.topicStatus === 'DEPT_APPROVED') {
        councilsApi.fetchAllCouncils()
          .then(list => {
            console.log("[DEBUG] Danh sách Hội đồng:", list);
            setCouncils(Array.isArray(list) ? list : []); 
          })
          .catch(err => console.error("Lỗi tải hội đồng:", err));

        usersApi.fetchAllUsers()
          .then(allUsers => {
            const usersArray = Array.isArray(allUsers) ? allUsers : [];
            const councilExperts = usersArray.filter(u => u.systemRole === 'COUNCIL');
            setExperts(councilExperts);
          })
          .catch(err => console.error("Lỗi tải users:", err));
      }

      setLoading(false); 
    };

    loadData();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [topicId]);

  const handleRejectProcedure = async (data) => {
    setActionLoading(true);
    try {
      await topicsApi.changeStatus(topicId, { targetStatus: 'REVISION_REQUIRED', feedbackMessage: data.feedbackMessage });
      addToast({ type: 'success', message: 'Đã trả hồ sơ yêu cầu bổ sung.' });
      navigate('/manager/dashboard');
    } catch { 
      setModalOpen(false); 
    } 
    finally { setActionLoading(false); }
  };

  const handleAssignExisting = async () => {
    if (!selectedCouncil) return;
    setActionLoading(true);
    try {
      await councilsApi.assignTopics(selectedCouncil, [Number(topicId)]);
      addToast({ type: 'success', message: 'Phân công Hội đồng thành công.' });
      navigate('/manager/dashboard');
    } catch(err) { 
      addToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi phân công.' });
    } finally {
      setActionLoading(false);
    }
  };

  // CẬP NHẬT: TÍCH HỢP GIAO DỊCH PHỨC HỢP (CREATE AND ASSIGN)
  const handleCreateAndAssign = async (data) => {
    const scheduledAt = new Date(`${data.meetingDate}T${data.meetingTime}`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
      addToast({ type: 'error', message: 'Ngày/giờ họp phải từ thời điểm hiện tại trở đi.' });
      return;
    }

    const memberAssignments = [
        { userId: Number(data.pId), councilRole: 'PRESIDENT' },
        { userId: Number(data.sId), councilRole: 'SECRETARY' },
        { userId: Number(data.r1Id), councilRole: 'REVIEWER' },
        { userId: Number(data.r2Id), councilRole: 'REVIEWER' },
        { userId: Number(data.mId), councilRole: 'MEMBER' }
    ];

    // Chặn lỗi người dùng chọn trùng chuyên gia trước khi gửi request
    const uniqueIds = new Set(memberAssignments.map(m => m.userId));
    if (uniqueIds.size < 5) {
        addToast({ type: 'error', message: 'Một chuyên gia không thể đảm nhiệm nhiều vai trò. Vui lòng chọn 5 chuyên gia khác nhau.' });
        return;
    }

    setActionLoading(true);
    try {
      const payload = {
        councilInfo: {
            councilName: data.councilName,
            meetingDate: data.meetingDate,
            meetingTime: data.meetingTime,
            meetingLocation: data.meetingLocation
        },
        members: memberAssignments,
        topicId: Number(topicId)
      };

      await councilsApi.createAndAssign(payload);
      
      addToast({ type: 'success', message: 'Hội đồng mới đã được tạo và phân công đề tài thành công.' });
      navigate('/manager/dashboard');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Tạo hội đồng thất bại. Vui lòng kiểm tra lại thông tin.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-4rem)]"><LoadingSpinner /></div>;
  if (!topic) return <div className="p-8 text-center text-red-500 font-bold">Không thể tải dữ liệu đề tài. Vui lòng kiểm tra lại.</div>;

  const isPendingManager = topic?.topicStatus === 'DEPT_APPROVED';

  const getStatusColor = (status) => {
    if (status === 'DEPT_APPROVED') return 'bg-yellow-100 text-yellow-800';
    if (status === 'PENDING_COUNCIL') return 'bg-indigo-100 text-indigo-800';
    if (status === 'REVISION_REQUIRED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getStatusLabel = (status) => {
    if (status === 'DEPT_APPROVED') return 'Khoa đã duyệt - Chờ kiểm tra thủ tục';
    if (status === 'PENDING_COUNCIL') return 'Đã giao Hội đồng';
    if (status === 'REVISION_REQUIRED') return 'Yêu cầu bổ sung hồ sơ';
    return status;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden -m-6 border-l border-gray-200">
      {/* HEADER */}
      <header className="bg-[#1a3a7c] border-b border-[#15306a] px-6 py-4 flex items-center justify-between text-white flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/manager/dashboard" className="text-gray-300 hover:text-white transition"><IcLeft /></Link>
          <div className="w-px h-6 bg-white/20" />
          <div>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Kiểm tra Thủ tục (SC-MAN)</p>
            <h1 className="text-sm font-bold leading-tight">{topic?.topicCode} — {topic?.titleVn}</h1>
          </div>
        </div>
      </header>

      {/* SPLIT PANE */}
      <div className="flex flex-1 min-h-0 bg-gray-50">
        
        {/* LEFT: PDF + SCIENTIFIC CONTEXT */}
        <div className="flex flex-col w-[60%] border-r border-gray-300 shadow-lg z-10">
          <div className="px-4 py-2 bg-gray-200 border-b border-gray-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <IcDoc cls="text-red-500 w-4 h-4"/>
              {leftPaneMode === 'PDF' ? 'Tệp Thuyết minh Nghiên cứu' : 'Nội dung khoa học do Chủ nhiệm kê khai'}
            </div>
            <RadioGroup.Root
              value={leftPaneMode}
              onValueChange={setLeftPaneMode}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-1"
              aria-label="Chế độ xem hồ sơ"
            >
              <RadioGroup.Item
                value="PDF"
                className="h-7 px-2.5 rounded-md text-[11px] font-bold text-gray-600 data-[state=checked]:bg-[#1a5ea8] data-[state=checked]:text-white"
              >
                PDF
              </RadioGroup.Item>
              <RadioGroup.Item
                value="DETAIL"
                className="h-7 px-2.5 rounded-md text-[11px] font-bold text-gray-600 data-[state=checked]:bg-[#1a5ea8] data-[state=checked]:text-white"
              >
                Nội dung
              </RadioGroup.Item>
            </RadioGroup.Root>
          </div>
          <div className="flex-1 overflow-auto bg-[#E0E0E0]">
            {leftPaneMode === 'PDF' ? (pdfUrl ? (
              <PdfPreview fileUrl={pdfUrl} title="Topic attachment preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500 font-medium">Không tìm thấy tệp đính kèm.</div>
            )) : <LeftPaneMetadataView topic={topic} />}
          </div>
        </div>

        {/* RIGHT: INFO & DECISION */}
        <div className="flex flex-col w-[40%] bg-white overflow-y-auto p-6 gap-6">
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Tóm tắt đề tài</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusColor(topic?.topicStatus)}`}>
                  {getStatusLabel(topic?.topicStatus)}
                </span>
            </div>
            <div className="text-sm space-y-3">
                <p><span className="text-gray-500">Chủ nhiệm:</span> <span className="font-semibold text-gray-900">{topic?.investigatorFullName}</span></p>
                {topic?.members?.length > 0 && (
                  <div><span className="text-gray-500">Thành viên:</span> <ul className="list-disc list-inside ml-2 mt-1">
                    {topic.members.map((m, i) => (<li key={m.id || i} className="text-xs font-semibold text-gray-800">{m.memberName}</li>))}
                  </ul></div>
                )}
                <p><span className="text-gray-500">Kinh phí:</span> <span className="font-black text-green-700">{formatVND(topic?.expectedBudget)}</span></p>
                <p><span className="text-gray-500">Khoa trực thuộc:</span> <span className="font-semibold text-gray-900">{topic?.managingDepartmentName}</span></p>
            </div>
            
            {topic?.auditLogs?.filter(l => l.newStatus === 'DEPT_APPROVED').map((l, i) => (
                <div key={i} className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-bold text-blue-900 mb-1">Ý kiến phê duyệt từ Phụ trách Khoa:</p>
                  <p className="text-xs italic bg-white/50 p-2.5 rounded border border-blue-100 shadow-sm text-blue-800">
                    "{l.feedbackNote || 'Đồng ý thông qua không có nhận xét thêm.'}"
                  </p>
                </div>
            ))}
          </div>

          {isPendingManager ? (
            !isProcedureValid ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold mb-4 text-gray-900">1. Kiểm tra Thủ tục Hành chính</h3>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">Vui lòng rà soát tính hợp lệ của hồ sơ trước khi đưa ra Hội đồng xét duyệt.</p>
                <div className="flex gap-3">
                  <button onClick={() => setModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 h-10 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition">
                    <IcX cls="w-4 h-4"/> Yêu cầu sửa / Trả về
                  </button>
                  <button onClick={() => setIsProcedureValid(true)} className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#1a5ea8] text-white rounded-lg text-sm font-bold hover:bg-[#15306a] transition shadow-sm">
                    <IcCheck cls="w-4 h-4"/> Hợp lệ - Bước tiếp
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4">
                <h3 className="text-sm font-bold text-indigo-900 mb-4">2. Thiết lập Hội đồng Xét duyệt</h3>
                
                <div className="flex bg-indigo-100/50 p-1 rounded-lg mb-5">
                  <button onClick={() => setAssignMode('EXISTING')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${assignMode === 'EXISTING' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600/70 hover:text-indigo-700'}`}>Hội đồng có sẵn</button>
                  <button onClick={() => setAssignMode('NEW')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${assignMode === 'NEW' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600/70 hover:text-indigo-700'}`}>Tạo mới (+)</button>
                </div>

                {assignMode === 'EXISTING' ? (
                  <div className="flex flex-col gap-3">
                    {councils.length === 0 ? (
                       <p className="text-xs text-indigo-600 italic bg-indigo-100/50 p-3 rounded">Hệ thống chưa có Hội đồng nào được tạo. Vui lòng chuyển sang tab "Tạo mới".</p>
                    ) : (
                      <select value={selectedCouncil} onChange={e => setSelectedCouncil(e.target.value)} className="w-full h-10 border border-indigo-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                        <option value="">— Chọn Hội đồng đã thành lập —</option>
                        {councils.map(c => <option key={c.councilId} value={c.councilId}>{c.councilName} ({c.meetingDate})</option>)}
                      </select>
                    )}
                    <div className="flex gap-3 mt-2">
                        <button onClick={() => setIsProcedureValid(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition">Quay lại</button>
                        <button onClick={handleAssignExisting} disabled={!selectedCouncil || actionLoading} className="flex-1 flex items-center justify-center gap-2 h-10 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50 text-sm font-bold transition shadow-sm">
                          <IcUsers cls="w-4 h-4"/> {actionLoading ? 'Đang xử lý...' : 'Xác nhận Phân công'}
                        </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateCouncilSubmit(handleCreateAndAssign)} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-800 uppercase mb-1">Tên Hội đồng *</label>
                      <input {...regCouncil('councilName', {required:true})} className="w-full h-9 border border-indigo-200 rounded px-2 text-sm" placeholder="VD: HĐ Đánh giá cấp Trường 01"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-indigo-800 uppercase mb-1">Ngày họp *</label>
                          <input type="date" min={todayStr} {...regCouncil('meetingDate', {required:true})} className="w-full h-9 border border-indigo-200 rounded px-2 text-sm"/>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-indigo-800 uppercase mb-1">Giờ họp *</label>
                          <input type="time" {...regCouncil('meetingTime', {required:true})} className="w-full h-9 border border-indigo-200 rounded px-2 text-sm"/>
                        </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-800 uppercase mb-1">Địa điểm *</label>
                      <input {...regCouncil('meetingLocation', {required:true})} className="w-full h-9 border border-indigo-200 rounded px-2 text-sm" placeholder="VD: Phòng họp A.101"/>
                    </div>
                    
                    <hr className="border-indigo-100 my-2"/>

                    <p className="text-[11px] font-bold text-indigo-800 uppercase">Cơ cấu Thành viên Hội đồng</p>
                    {['pId', 'sId', 'r1Id', 'r2Id', 'mId'].map((f, i) => (
                      <div key={f} className="flex flex-col">
                        <label className="text-[11px] font-semibold text-gray-600 mb-1">{['Chủ tịch HĐ', 'Thư ký HĐ', 'Phản biện 1', 'Phản biện 2', 'Ủy viên'][i]} *</label>
                        <select {...regCouncil(f, {required:true})} className="w-full h-9 border border-indigo-200 rounded px-2 text-sm">
                          <option value="">— Chọn Chuyên gia —</option>
                          {experts.map(e => <option key={e.userId} value={e.userId}>{e.fullName} ({e.email})</option>)}
                        </select>
                      </div>
                    ))}
                    
                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setIsProcedureValid(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition">Hủy tạo</button>
                        <button type="submit" disabled={actionLoading || experts.length < 5} className="flex-1 flex items-center justify-center gap-2 h-10 bg-indigo-700 text-white rounded-lg text-sm font-bold hover:bg-indigo-800 disabled:opacity-50 transition shadow-sm">
                          <IcPlus cls="w-4 h-4"/> {actionLoading ? 'Đang khởi tạo...' : 'Tạo HĐ & Phân công'}
                        </button>
                    </div>
                    {experts.length < 5 && <p className="text-xs text-amber-600 italic mt-2">Hệ thống chưa có đủ 5 tài khoản chuyên gia (Vai trò COUNCIL) để tạo hội đồng.</p>}
                  </form>
                )}
              </div>
            )
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center shadow-inner">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">Hồ sơ đã được phân công xử lý</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lịch sử luân chuyển</h3>
              <div className="space-y-4">
                {topic?.auditLogs?.map((log, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-xs">{getStatusLabel(log.newStatus) || log.newStatus}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{log.actorFullName} • {formatDateTime(log.actionTimestamp)}</p>
                      {log.feedbackNote && (
                        <p className="text-[11px] text-amber-700 mt-1.5 p-3 bg-amber-50 rounded-lg border border-amber-100 leading-relaxed italic">
                          "{log.feedbackNote}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
          </div>

        </div>
      </div>

      {/* Modal Trả hồ sơ */}
      {modalOpen && (
        <FocusTrappedModal onClose={() => !actionLoading && setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b bg-red-50 flex items-center gap-2 text-red-700 font-bold">
              <IcAlert cls="w-5 h-5"/> Yêu cầu bổ sung thủ tục
            </div>
            <form onSubmit={handleRejectSubmit(handleRejectProcedure)} className="p-6">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Lý do thiếu sót thủ tục <span className="text-red-500">*</span></label>
              <textarea 
                {...regReject('feedbackMessage', {required:true})} 
                rows={4} 
                placeholder="Ghi rõ các loại giấy tờ, chữ ký còn thiếu để báo cho Chủ nhiệm..." 
                className={`w-full rounded-lg border bg-gray-50 p-3 text-sm outline-none focus:ring-2 transition ${errReject.feedbackMessage ? 'border-red-500 ring-red-200' : 'border-gray-200 focus:border-[#1a5ea8] focus:ring-[#1a5ea8]/20'}`}
              />
              {errReject.feedbackMessage && <p className="text-[11px] text-red-500 mt-1">Vui lòng nhập lý do để chủ nhiệm biết cách khắc phục.</p>}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} disabled={actionLoading} className="flex-1 h-10 border rounded-lg text-gray-500 font-bold hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={actionLoading || !feedbackMessage?.trim()} className="flex-1 h-10 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50">Xác nhận gửi</button>
              </div>
            </form>
          </div>
        </FocusTrappedModal>
      )}
    </div>
  );
}
