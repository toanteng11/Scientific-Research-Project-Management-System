// File: src/pages/researcher/TopicRevisionFormPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { NumericFormat } from 'react-number-format';

import { topicsApi } from '../../api/topics.api';
import useUiStore from '../../store/uiStore';
import { applyFieldErrors } from '../../utils/errorHandler';
import DragDropZone from '../../components/forms/DragDropZone';
import RichTextEditor from '../../components/forms/RichTextEditor';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PdfPreview from '../../components/ui/PdfPreview';
import { formatDateTime } from '../../utils/formatters';
import logoOU from '../../assets/ADMIN/logo-ou.svg';

// ─── Schema Validation ────────────────────────────────────────────────────────

const schema = yup.object({
  titleVn: yup.string().required('Bắt buộc').min(10).max(500),
  titleEn: yup.string().max(500).nullable(),
  researchType: yup.string().required('Bắt buộc'),
  researchField: yup.string().required('Bắt buộc'),
  durationMonths: yup.number().typeError('Phải là số').required('Bắt buộc').integer().min(6).max(48),
  expectedBudget: yup.number().typeError('Phải là số').required('Bắt buộc').positive().max(10000000000),
  rebuttalText: yup.string().required('Cần có giải trình chỉnh sửa').min(50, 'Tối thiểu 50 ký tự'),
});

// ─── SVG Factory ────────────────────────────────────────────────────────────────

const Svg = ({ d, cls = "w-5 h-5", sw = 2, fill = "none" }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const IcLeft       = p => <Svg {...p} d="M10 19l-7-7m0 0l7-7m-7 7h18" />;
const IcDoc        = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcDownload   = p => <Svg {...p} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;
const IcCheck      = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcX          = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;
const IcAlert      = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcHistory    = p => <Svg {...p} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IcSend       = p => <Svg {...p} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />;
const IcInfo       = p => <Svg {...p} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;

// ─── Confirm Modal ────────────────────────────────────────────────────────────────

const ConfirmModal = ({ newFile, onClose, onConfirm, submitting }) => (
  <FocusTrappedModal onClose={onClose} dismissible={!submitting}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <IcSend cls="w-5 h-5 text-[#1a5ea8]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 leading-tight">Xác nhận nộp lại hồ sơ</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Hành động này sẽ cập nhật dữ liệu gốc</p>
            </div>
          </div>
          {!submitting && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
              <IcX cls="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Bản chỉnh sửa và giải trình của bạn sẽ được lưu trực tiếp vào CSDL. Nếu hồ sơ ở trạng thái <strong>Yêu cầu chỉnh sửa</strong>, nó sẽ tiếp tục được xem xét.
          </p>

          <div className="bg-[#eaf5fc] rounded-xl border border-blue-100 p-4 flex flex-col gap-2.5">
            <p className="text-[10px] font-bold text-[#1a5ea8] uppercase tracking-wider">Tóm tắt hồ sơ</p>
            <div className="flex items-center gap-2">
              <IcDoc cls="w-4 h-4 text-[#1a5ea8]" />
              <span className="text-[12.5px] font-semibold text-gray-700">
                {newFile ? newFile.name : "Giữ nguyên file PDF hiện tại"}
                {newFile && <span className="ml-2 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">v2 mới</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IcAlert cls="w-4 h-4 text-amber-500" />
              <span className="text-[12px] text-amber-700">Kèm giải trình và Cập nhật nội dung Form</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button disabled={submitting} onClick={onClose} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
            Hủy bỏ
          </button>
          <button disabled={submitting} onClick={onConfirm} className={`flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm ${submitting ? 'bg-[#1a5ea8]/70 text-white cursor-wait' : 'bg-[#1a5ea8] hover:bg-[#15306a] text-white'}`}>
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang gửi...
              </>
            ) : (
              <>
                <IcSend cls="w-4 h-4" /> Xác nhận nộp lại
              </>
            )}
          </button>
        </div>
      </div>
  </FocusTrappedModal>
);

// ─── Main View ────────────────────────────────────────────────────────────────

export default function TopicRevisionFormPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  
  const [topic, setTopic] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [leftTab, setLeftTab] = useState("feedback");

  const { register, handleSubmit, reset, control, setError, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { rebuttalText: '' }
  });

  const rebuttalText = useWatch({ control, name: 'rebuttalText' });
  const canSubmit = rebuttalText?.trim().length >= 50;

  useEffect(() => {
    let objectUrl = null;

    const load = async () => {
      try {
        const res = await topicsApi.getById(topicId);
        const data = res.data;
        setTopic(data);
        reset({
          titleVn: data.titleVn ?? '',
          titleEn: data.titleEn ?? '',
          researchType: data.researchType ?? '',
          researchField: data.researchField ?? '',
          durationMonths: data.durationMonths ?? '',
          expectedBudget: data.expectedBudget ?? '',
          urgencyStatement: data.urgencyStatement ?? '',
          generalObjective: data.generalObjective ?? '',
          specificObjectives: data.specificObjectives ?? '',
          researchApproach: data.researchApproach ?? '',
          researchMethods: data.researchMethods ?? '',
          researchScope: data.researchScope ?? '',
          implementationPlan: data.implementationPlan ?? '',
          expectedProductsType1: data.expectedProductsType1 ?? '',
          expectedProductsType2: data.expectedProductsType2 ?? '',
          trainingPlan: data.trainingPlan ?? '',
          budgetExplanation: data.budgetExplanation ?? '',
          rebuttalText: '', 
        });

        if (data.attachments?.length > 0) {
          const att = data.attachments[0];
          const blobRes = await topicsApi.downloadAttachment(topicId, att.attachmentId);
          const url = URL.createObjectURL(blobRes.data);
          objectUrl = url;
          setPdfUrl(url);
        }
      } catch { /* interceptor */ }
      finally { setLoading(false); }
    };
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [topicId, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const values = watch();
      // Prefix rebuttal to urgency for demo purpose, ideally backend adds a rebuttal field
      const prefixedUrgency = `--- GIẢI TRÌNH CHỈNH SỬA ---\n${data.rebuttalText}\n\n--- NỘI DUNG ---\n${values.urgencyStatement || ''}`;

      await topicsApi.update(topicId, {
        titleVn: data.titleVn,
        titleEn: data.titleEn || null,
        researchType: data.researchType,
        researchField: data.researchField,
        durationMonths: Number(data.durationMonths),
        expectedBudget: Number(data.expectedBudget),
        urgencyStatement: prefixedUrgency,
        generalObjective: values.generalObjective || null,
        specificObjectives: values.specificObjectives || null,
        researchApproach: values.researchApproach || null,
        researchMethods: values.researchMethods || null,
        researchScope: values.researchScope || null,
        implementationPlan: values.implementationPlan || null,
        expectedProductsType1: values.expectedProductsType1 || null,
        expectedProductsType2: values.expectedProductsType2 || null,
        trainingPlan: values.trainingPlan || null,
        budgetExplanation: values.budgetExplanation || null,
      });

      if (newFile) {
        await topicsApi.uploadAttachment(topicId, newFile);
      }

      // [BỔ SUNG LOGIC FSM]: Sau khi cập nhật nội dung, hệ thống phải tự động kích hoạt chuyển trạng thái để nộp lại.
      // Dựa trên FSM Backend, trạng thái REVISION_REQUIRED chuyển sang PENDING_REVIEW.
      await topicsApi.changeStatus(topicId, {
          targetStatus: 'PENDING_REVIEW', // Gửi lại vào luồng xét duyệt
          feedbackMessage: 'Chủ nhiệm đã nộp lại bản giải trình và cập nhật hồ sơ theo yêu cầu.'
      });

      setConfirmOpen(false);
      addToast({ type: 'success', message: 'Hồ sơ đề tài đã được nộp lại thành công. Chờ xét duyệt.' });
      navigate(`/researcher/dashboard`);
    } catch (err) {
      if (err.response?.status === 400) applyFieldErrors(err, setError);
      setConfirmOpen(false);
      addToast({ type: 'error', message: 'Lỗi khi nộp lại hồ sơ.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadOld = useCallback(() => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `ThuyetMinh_v1_${topicId}.pdf`;
      a.click();
    }
  }, [pdfUrl, topicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoadingSpinner label="Đang tải hồ sơ chỉnh sửa" sizeClass="h-8 w-8" borderClass="border-b-2 border-[#1a5ea8]" />
      </div>
    );
  }

  const feedbackLogs = topic?.auditLogs?.filter(l => l.feedbackNote) || [];
  const latestFeedback = feedbackLogs.length > 0 ? feedbackLogs[feedbackLogs.length - 1] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#eaf5fc] overflow-hidden -m-6 border-l border-gray-200">
      
      {/* ── Global Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3.5 flex items-center gap-4 flex-shrink-0 z-10">
        <button onClick={() => navigate(`/researcher/topics/${topicId}`)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1a5ea8] transition px-3 py-1.5 rounded-lg hover:bg-blue-50 flex-shrink-0">
          <IcLeft cls="w-4 h-4" /> Quay lại
        </button>
        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img src={logoOU} alt="OU" className="h-8 w-auto object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SC-RES-04 · Cập nhật hồ sơ</p>
            <h1 className="text-sm font-bold text-gray-800 truncate leading-tight">
              {topic?.titleVn}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-700">Trạng thái: Yêu cầu chỉnh sửa</span>
          </span>
        </div>
      </header>

      {/* ── Main Split Area ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ────────────────────── Left Panel: Reference (40%) ────────────────────── */}
        <div className="flex flex-col w-[40%] min-w-[320px] flex-shrink-0 bg-[#F4F5F7] border-r border-gray-200 overflow-hidden relative shadow-sm z-10">
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            {[
              { id: "feedback", label: "Yêu cầu chỉnh sửa", icon: <IcAlert cls="w-3.5 h-3.5" /> },
              { id: "oldver",   label: "Bản PDF hiện tại", icon: <IcHistory cls="w-3.5 h-3.5" /> },
            ].map(t => (
              <button key={t.id} onClick={() => setLeftTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition border-b-2 ${leftTab === t.id ? "border-[#1a5ea8] text-[#1a5ea8] bg-[#eaf5fc]" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {leftTab === "feedback" ? (
              <div className="p-5 flex flex-col gap-4">
                <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2">
                    <IcAlert cls="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Nhận xét Hội đồng / Khoa</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {latestFeedback ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{latestFeedback.actorFullName} ({latestFeedback.actorRole})</span>
                        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{latestFeedback.feedbackNote}</p>
                        <span className="text-[10px] text-gray-400 mt-2">{formatDateTime(latestFeedback.actionTimestamp)}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Không tìm thấy yêu cầu chỉnh sửa cụ thể trong hệ thống.</p>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-800 mb-2">Hướng dẫn Cập nhật:</p>
                  <ul className="text-[11.5px] text-amber-700 list-disc list-inside space-y-1.5 leading-relaxed">
                    <li>Sửa trực tiếp các trường nội dung ở Form bên phải.</li>
                    <li>Tải lên File PDF Thuyết minh mới (Phiên bản v2).</li>
                    <li>Bắt buộc phải điền <strong>Giải trình chỉnh sửa</strong> ở mục số 3.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-[#E0E0E0]">
                <div className="flex flex-col flex-1 overflow-auto p-4 items-center">
                  {pdfUrl ? (
                     <div className="w-full h-full max-w-lg">
                       <PdfPreview fileUrl={pdfUrl} title="Current topic PDF preview" />
                     </div>
                  ) : (
                    <div className="text-gray-400 mt-20 text-sm">Không có file PDF cũ.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ────────────────────── Right Panel: Edit Form (60%) ────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <form className="flex flex-col gap-8 max-w-3xl mx-auto pb-10">
              
              {/* Section 1: Form Metadata & Rich Text */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-[#c5e2f5] flex items-center justify-center text-[#1a5ea8] text-[11px] font-black">1</span>
                  <h2 className="text-[15px] font-bold text-gray-800">Cập nhật Nội dung Đề tài</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">Tên đề tài (Tiếng Việt) <span className="text-red-500">*</span></label>
                    <input {...register('titleVn')} className={`w-full h-10 rounded-lg border bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#1a5ea8]/20 px-3.5 text-[13px] text-gray-800 outline-none transition ${errors.titleVn ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`} />
                    {errors.titleVn && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.titleVn.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">Tên đề tài (Tiếng Anh)</label>
                    <input {...register('titleEn')} className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#1a5ea8] focus:ring-2 focus:ring-[#1a5ea8]/20 px-3.5 text-[13px] text-gray-800 outline-none transition" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">Loại hình <span className="text-red-500">*</span></label>
                      <input {...register('researchType')} className={`w-full h-10 rounded-lg border bg-gray-50/50 focus:bg-white focus:ring-2 px-3.5 text-[13px] outline-none transition ${errors.researchType ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`} />
                    </div>
                    <div>
                      <label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">Lĩnh vực <span className="text-red-500">*</span></label>
                      <input {...register('researchField')} className={`w-full h-10 rounded-lg border bg-gray-50/50 focus:bg-white focus:ring-2 px-3.5 text-[13px] outline-none transition ${errors.researchField ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">Thời gian (tháng) <span className="text-red-500">*</span></label>
                      <input type="number" {...register('durationMonths')} className={`w-full h-10 rounded-lg border bg-gray-50/50 focus:bg-white focus:ring-2 px-3.5 text-[13px] outline-none transition ${errors.durationMonths ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`} />
                    </div>
                    <div>
                      <label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">Kinh phí (VND) <span className="text-red-500">*</span></label>
                      <Controller name="expectedBudget" control={control} render={({ field }) => (
                        <NumericFormat value={field.value} onValueChange={(vals) => field.onChange(vals.floatValue)} thousandSeparator="," suffix=" VND" decimalScale={0} className={`w-full h-10 rounded-lg border bg-gray-50/50 focus:bg-white focus:ring-2 px-3.5 text-[13px] outline-none transition ${errors.expectedBudget ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`} />
                      )} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 mt-4">
                  <Controller name="urgencyStatement" control={control} render={({ field }) => <RichTextEditor label="Tính cấp thiết" value={field.value} onChange={field.onChange} />} />
                  <Controller name="generalObjective" control={control} render={({ field }) => <RichTextEditor label="Mục tiêu tổng quát" value={field.value} onChange={field.onChange} />} />
                  <Controller name="specificObjectives" control={control} render={({ field }) => <RichTextEditor label="Mục tiêu cụ thể" value={field.value} onChange={field.onChange} />} />
                  <Controller name="researchApproach" control={control} render={({ field }) => <RichTextEditor label="Cách tiếp cận" value={field.value} onChange={field.onChange} />} />
                  <Controller name="researchMethods" control={control} render={({ field }) => <RichTextEditor label="Phương pháp nghiên cứu" value={field.value} onChange={field.onChange} />} />
                  <Controller name="implementationPlan" control={control} render={({ field }) => <RichTextEditor label="Kế hoạch triển khai" value={field.value} onChange={field.onChange} />} />
                  <Controller name="expectedProductsType1" control={control} render={({ field }) => <RichTextEditor label="Sản phẩm Dạng I" value={field.value} onChange={field.onChange} />} />
                  <Controller name="budgetExplanation" control={control} render={({ field }) => <RichTextEditor label="Dự toán kinh phí chi tiết" value={field.value} onChange={field.onChange} />} />
                </div>
              </div>

              {/* Section 2: File Upload */}
              <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 pb-1">
                  <span className="w-6 h-6 rounded-full bg-[#c5e2f5] flex items-center justify-center text-[#1a5ea8] text-[11px] font-black">2</span>
                  <h2 className="text-[14px] font-bold text-gray-800">Cập nhật Tệp đính kèm Thuyết minh</h2>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tệp hiện tại (v1)</p>
                  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${newFile ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 shadow-sm"}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${newFile ? "bg-gray-100" : "bg-red-50"}`}>
                      <IcDoc cls={`w-5 h-5 ${newFile ? "text-gray-400" : "text-red-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold leading-tight ${newFile ? "text-gray-400 line-through" : "text-gray-700"}`}>Thuyết_minh_v1.pdf</p>
                      {newFile && <span className="text-[10px] font-bold text-gray-400 mt-1 block">— Đã thay thế bởi tệp mới</span>}
                    </div>
                    {!newFile && (
                      <button type="button" onClick={handleDownloadOld} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
                        <IcDownload cls="w-3.5 h-3.5" /> Tải xuống bản cũ
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tải lên bản chỉnh sửa mới (v2)</p>
                  <DragDropZone file={newFile} onFileSelect={setNewFile} onRemove={() => setNewFile(null)} />
                </div>
              </div>

              {/* Section 3: Rebuttal */}
              <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 pb-1">
                  <span className="w-6 h-6 rounded-full bg-[#c5e2f5] flex items-center justify-center text-[#1a5ea8] text-[11px] font-black">3</span>
                  <h2 className="text-[14px] font-bold text-gray-800">Giải trình chỉnh sửa <span className="text-red-500 ml-1">*</span></h2>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <textarea
                    {...register('rebuttalText')}
                    placeholder="Mô tả chi tiết những thay đổi bạn đã thực hiện để đáp ứng từng yêu cầu của Hội đồng/Khoa..."
                    rows={8}
                    className={`resize-none rounded-xl border bg-gray-50/40 focus:bg-white focus:ring-2 focus:ring-[#1a5ea8]/20 text-[13px] text-gray-700 leading-relaxed px-4 py-4 outline-none transition placeholder:text-gray-400 ${errors.rebuttalText ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[11px] font-medium ${canSubmit ? "text-green-600" : "text-amber-600"}`}>
                      {canSubmit ? <><IcCheck cls="w-3 h-3 inline mr-1" />Nội dung hợp lệ</> : "Cần nhập tối thiểu 50 ký tự để nộp hồ sơ"}
                    </p>
                    <p className="text-[11px] text-gray-400">{rebuttalText?.length || 0} ký tự</p>
                  </div>
                </div>
                {errors.root && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errors.root.message}</div>}
              </div>

            </form>
          </div>

          {/* Sticky Footer */}
          <div className="border-t border-gray-200 bg-white px-8 py-4 flex items-center justify-between gap-4 flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20">
            <div className="flex items-center gap-2 min-w-0">
              {!canSubmit && (
                <div className="flex items-center gap-2 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <IcInfo cls="w-3.5 h-3.5 flex-shrink-0 text-amber-500" /> Nhập Nội dung giải trình (Mục 3) để mở khóa nút Nộp lại
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button disabled={submitting} onClick={() => navigate(`/researcher/topics/${topicId}`)} className="h-10 px-5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
                Hủy bỏ
              </button>
              <button disabled={!canSubmit || submitting} onClick={handleSubmit(() => setConfirmOpen(true))} className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-bold transition shadow-sm ${canSubmit && !submitting ? "bg-[#1a5ea8] hover:bg-[#15306a] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                <IcSend cls="w-4 h-4" /> Xác nhận & Nộp lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && <ConfirmModal newFile={newFile} onClose={() => setConfirmOpen(false)} onConfirm={handleSubmit(onSubmit)} submitting={submitting} />}
    </div>
  );
}
