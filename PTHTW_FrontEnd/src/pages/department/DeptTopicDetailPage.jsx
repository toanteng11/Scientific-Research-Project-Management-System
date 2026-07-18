import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { topicsApi } from '../../api/topics.api';
import useUiStore from '../../store/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PdfPreview from '../../components/ui/PdfPreview';
import RichTextDisplay from '../../components/ui/RichTextDisplay';
import { formatVND, formatDateTime } from '../../utils/formatters';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal'; 

// Icons SVG Factory
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
    <div className="rounded-xl border border-blue-100 bg-white p-4">
      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Mã đề tài</p>
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

export default function DeptTopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  
  const [topic, setTopic] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalState, setModalState] = useState({ open: false, type: null }); 
  const [leftPaneMode, setLeftPaneMode] = useState('PDF');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const feedbackMessage = watch('feedbackMessage');

  useEffect(() => {
    let objectUrl;
    const load = async () => {
      try {
        const res = await topicsApi.getById(topicId);
        setTopic(res.data);
        
        // KIẾN TRÚC PHỤC HỒI: Xử lý tệp đính kèm sau khi Backend đã trả về mảng attachments đúng contract
        const attachments = res.data?.attachments ?? [];
        if (attachments.length > 0) {
          // Lấy tệp mới nhất (index 0) để hiển thị sơ duyệt
          const blobRes = await topicsApi.downloadAttachment(topicId, attachments[0].attachmentId);
          objectUrl = URL.createObjectURL(blobRes.data);
          setPdfUrl(objectUrl);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu đề tài:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [topicId]);

  const executeAction = async (data) => {
    setActionLoading(true);
    const targetStatus = modalState.type === 'APPROVE' ? 'DEPT_APPROVED' : 'DEPT_REJECTED';
    
    try {
      await topicsApi.changeStatus(topicId, { 
        targetStatus: targetStatus, 
        feedbackMessage: data.feedbackMessage 
      });
      addToast({ type: 'success', message: 'Đã hoàn tất sơ duyệt cấp Khoa.' });
      navigate('/department/dashboard');
    } catch { 
      setModalState({ open: false, type: null });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[calc(100vh-4rem)]"><LoadingSpinner /></div>;
  }

  // KIẾN TRÚC PHỤC HỒI: Kiểm tra tương thích với chuỗi JSON Serialize từ Spring Boot (@JsonProperty("PENDING_DEPT"))
  const isPending = topic?.topicStatus === 'PENDING_DEPT' || topic?.topicStatus === 'PENDING_REVIEW';

  const getStatusColor = (status) => {
    if (status === 'PENDING_DEPT' || status === 'PENDING_REVIEW') return 'bg-yellow-100 text-yellow-800';
    if (status === 'DEPT_APPROVED' || status === 'APPROVED') return 'bg-green-100 text-green-800';
    if (status === 'DEPT_REJECTED' || status === 'REVISION_REQUIRED' || status === 'REJECTED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    if (status === 'DRAFT') return 'Bản nháp';
    if (status === 'PENDING_DEPT' || status === 'PENDING_REVIEW') return 'Chờ duyệt cấp Khoa';
    if (status === 'DEPT_APPROVED') return 'Khoa đã duyệt';
    if (status === 'DEPT_REJECTED') return 'Khoa yêu cầu sửa / Từ chối';
    if (status === 'PENDING_COUNCIL') return 'Chờ gán hội đồng';
    return status;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden -m-6 border-l border-gray-200">
      {/* ── Header ── */}
      <header className="bg-[#1a3a7c] border-b border-[#15306a] shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0 z-10 text-white">
        <div className="flex items-center gap-4">
          <Link to="/department/dashboard" className="text-gray-300 hover:text-white transition"><IcLeft cls="w-5 h-5" /></Link>
          <div className="w-px h-6 bg-white/20" />
          <div>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Sơ duyệt cấp Đơn vị (SC-DEPT)</p>
            <h1 className="text-sm font-bold leading-tight">{topic?.topicCode} — {topic?.titleVn}</h1>
          </div>
        </div>
      </header>

      {/* ── Split Screen ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-gray-50">
        
        {/* Left: PDF + Scientific Context */}
        <div className="flex flex-col w-[60%] border-r border-gray-300 shadow-lg z-10">
          <div className="px-4 py-2 bg-gray-200 border-b border-gray-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <IcDoc cls="w-4 h-4 text-red-500" />
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
              <div className="flex items-center justify-center h-full text-sm text-gray-500 font-medium italic">
                Không tìm thấy tệp đính kèm. Hồ sơ chưa được tải lên đầy đủ.
              </div>
            )) : <LeftPaneMetadataView topic={topic} />}
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col w-[40%] bg-white overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Tóm tắt Đề tài</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusColor(topic?.topicStatus)}`}>
                    {getStatusLabel(topic?.topicStatus)}
                  </span>
              </div>
              <div className="grid grid-cols-1 gap-y-3 text-sm">
                <div><span className="text-gray-500">Chủ nhiệm:</span> <span className="font-semibold text-gray-900">{topic?.investigatorFullName}</span></div>
                
                {topic?.members?.length > 0 && (
                    <div>
                        <span className="text-gray-500">Thành viên tham gia:</span> 
                        <ul className="list-disc list-inside ml-2 mt-1">
                            {topic.members.map((m, idx) => (
                                <li key={m.id || idx} className="font-semibold text-gray-800 text-xs">{m.memberName}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div><span className="text-gray-500">Lĩnh vực:</span> <span className="font-semibold text-gray-900">{topic?.researchField}</span></div>
                <div><span className="text-gray-500">Kinh phí dự kiến:</span> <span className="font-black text-green-700">{formatVND(topic?.expectedBudget)}</span></div>
                <div><span className="text-gray-500">Thời gian thực hiện:</span> <span className="font-semibold text-gray-900">{topic?.durationMonths} tháng</span></div>
              </div>
            </div>

            {isPending ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Ra quyết định Sơ duyệt</h3>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                  Vui lòng đọc kỹ tệp thuyết minh bên trái trước khi ra quyết định. Ý kiến phản hồi sẽ được gửi trực tiếp cho Chủ nhiệm đề tài.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setModalState({ open: true, type: 'REJECT' })}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-bold transition">
                    <IcX cls="w-4 h-4" /> Yêu cầu sửa / Từ chối
                  </button>
                  <button onClick={() => setModalState({ open: true, type: 'APPROVE' })}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#1a5ea8] text-white hover:bg-[#15306a] text-sm font-bold transition shadow-sm">
                    <IcCheck cls="w-4 h-4" /> Đồng ý duyệt
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center shadow-inner">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">Hồ sơ đã hoàn tất xử lý tại cấp Đơn vị</p>
              </div>
            )}

            {/* Lịch sử kiểm toán */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lịch sử luân chuyển</h3>
              <div className="space-y-4">
                {topic?.auditLogs?.map((log, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-xs">{getStatusLabel(log.newStatus)}</p>
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
      </div>

      {/* ── Modal Xác nhận ── */}
      {modalState.open && (
        <FocusTrappedModal onClose={() => !actionLoading && setModalState({ open: false, type: null })}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b flex items-center gap-2 ${modalState.type === 'APPROVE' ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
              {modalState.type === 'APPROVE' ? <IcCheck cls="w-5 h-5 text-[#1a5ea8]" /> : <IcAlert cls="w-5 h-5 text-red-600" />}
              <h3 className={`text-sm font-bold ${modalState.type === 'APPROVE' ? 'text-[#1a5ea8]' : 'text-red-700'}`}>
                {modalState.type === 'APPROVE' ? 'Xác nhận Đồng ý Duyệt hồ sơ' : 'Yêu cầu Chỉnh sửa / Từ chối hồ sơ'}
              </h3>
            </div>
            <form onSubmit={handleSubmit(executeAction)} className="p-6">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Nhận xét / Lý do (Bắt buộc nếu yêu cầu chỉnh sửa) <span className="text-red-500">*</span>
              </label>
              <textarea 
                {...register('feedbackMessage', { required: modalState.type === 'REJECT' })}
                rows={4} 
                placeholder="Nhập nội dung phản hồi tại đây..."
                className={`w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 transition ${errors.feedbackMessage ? 'border-red-500 ring-red-200' : 'border-gray-200 focus:border-[#1a5ea8] focus:ring-[#1a5ea8]/20'}`}
              />
              {errors.feedbackMessage && <p className="text-[11px] text-red-500 mt-1">Vui lòng cung cấp lý do cụ thể.</p>}
              
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setModalState({ open: false, type: null })} disabled={actionLoading} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Hủy bỏ</button>
                <button type="submit" disabled={actionLoading || (modalState.type === 'REJECT' && !feedbackMessage?.trim())} className={`flex-1 h-10 rounded-lg text-sm font-bold text-white transition shadow-sm ${modalState.type === 'APPROVE' ? 'bg-[#1a5ea8] hover:bg-[#15306a]' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}>
                  {actionLoading ? 'Đang gửi...' : 'Xác nhận gửi'}
                </button>
              </div>
            </form>
          </div>
        </FocusTrappedModal>
      )}
    </div>
  );
}
