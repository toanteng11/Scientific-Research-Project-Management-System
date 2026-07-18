import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import FormStepper from '../../components/forms/FormStepper';
import RichTextEditor from '../../components/forms/RichTextEditor';
import DragDropZone from '../../components/forms/DragDropZone';
import { topicsApi } from '../../api/topics.api';
import { referenceApi } from '../../api/reference.api';
import { departmentsApi } from '../../api/departments.api';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { applyFieldErrors } from '../../utils/errorHandler';

const STEPS = ['Thông tin chung', 'Mục tiêu', 'Phương pháp', 'Sản phẩm & Kinh phí', 'Nhân sự & Tệp đính kèm'];

const RESEARCH_TYPE_LABELS = {
  BASIC: 'Nghiên cứu cơ bản',
  APPLIED: 'Nghiên cứu ứng dụng',
  EXPERIMENTAL: 'Triển khai thực nghiệm',
};

const FALLBACK_RESEARCH_TYPES = Object.keys(RESEARCH_TYPE_LABELS);

const FALLBACK_RESEARCH_FIELDS = [
  'Công nghệ thông tin và Trí tuệ nhân tạo',
  'Khoa học tự nhiên',
  'Khoa học xã hội và Hành vi',
  'Kỹ thuật và Công nghệ',
  'Y sinh và Sức khỏe cộng đồng',
  'Kinh tế và Quản trị',
  'Giáo dục và Sư phạm',
  'Khác',
];

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

const richTextMinTest = (min) => ({
  name: 'min-text',
  message: `Tối thiểu ${min} ký tự`,
  test: (v) => stripHtml(v || '').length >= min,
});

const schemas = [
  // Step 0: Admin Info
  yup.object({
    titleVn: yup.string().required('Bắt buộc').min(10, 'Tối thiểu 10 ký tự').max(500),
    titleEn: yup.string().required('Bắt buộc').min(10, 'Tối thiểu 10 ký tự').max(500),
    researchField: yup.string().required('Bắt buộc'),
    researchType: yup.string().required('Bắt buộc'),
    durationMonths: yup.number().typeError('Phải là số').required('Bắt buộc').integer().min(6, 'Tối thiểu 6 tháng').max(48, 'Tối đa 48 tháng'),
    managingDepartmentId: yup.string().required('Bắt buộc'),
  }),
  // Step 1: Objectives
  yup.object({
    urgencyStatement: yup.string().required('Bắt buộc').test(richTextMinTest(50)),
    generalObjective: yup.string().required('Bắt buộc').test(richTextMinTest(50)),
    specificObjectives: yup.string().required('Bắt buộc').test(richTextMinTest(50)),
  }),
  // Step 2: Methodology
  yup.object({
    researchApproach: yup.string().required('Bắt buộc').test(richTextMinTest(30)),
    researchMethods: yup.string().required('Bắt buộc').test(richTextMinTest(30)),
    researchScope: yup.string().required('Bắt buộc').min(30, 'Tối thiểu 30 ký tự').max(2000),
    implementationPlan: yup.string().nullable(),
  }),
  // Step 3: Products & Budget
  yup.object({
    expectedProductsType1: yup.string().nullable(),
    expectedProductsType2: yup.string().nullable(),
    trainingPlan: yup.string().nullable(),
    expectedBudget: yup.number().typeError('Phải là số').required('Bắt buộc').positive('Phải lớn hơn 0').max(10000000000),
    budgetExplanation: yup.string().nullable(),
  }),
  // Step 4: Personnel & Attachments
  yup.object({
    memberNames: yup.array().of(yup.string().max(255)),
  }),
];

const STEP_FIELDS = [
  ['titleVn', 'titleEn', 'researchField', 'researchType', 'durationMonths', 'managingDepartmentId'],
  ['urgencyStatement', 'generalObjective', 'specificObjectives'],
  ['researchApproach', 'researchMethods', 'researchScope', 'implementationPlan'],
  ['expectedProductsType1', 'expectedProductsType2', 'trainingPlan', 'expectedBudget', 'budgetExplanation'],
  ['memberNames'],
];

export default function TopicSubmissionWizardPage() {
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const userClaims = useAuthStore((s) => s.userClaims);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [proposalFile, setProposalFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enums, setEnums] = useState({});
  const [departments, setDepartments] = useState([]);
  const { register, control, trigger, setError, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schemas[currentStep]),
    mode: 'onChange',
    defaultValues: {
      titleVn: '', titleEn: '', researchField: '', researchType: '',
      durationMonths: '', managingDepartmentId: '', memberNames: [],
      urgencyStatement: '', generalObjective: '', specificObjectives: '',
      researchApproach: '', researchMethods: '', researchScope: '',
      implementationPlan: '',
      expectedProductsType1: '', expectedProductsType2: '',
      trainingPlan: '',
      expectedBudget: '', budgetExplanation: '',
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const enumRes = await referenceApi.getEnums();
        if (!cancelled) setEnums(enumRes.data?.enums ?? {});
      } catch { /* interceptor handles */ }
    })();
    (async () => {
      try {
        const list = await departmentsApi.fetchAllDepartments();
        if (!cancelled) setDepartments(list);
      } catch {
        if (!cancelled) setDepartments([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goNext = useCallback(async () => {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (!valid) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [currentStep, trigger]);

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const onSubmit = async () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const valid = await trigger(STEP_FIELDS[i]);
      if (!valid) { setCurrentStep(i); return; }
    }

    setIsSubmitting(true);
    try {
      const values = watch();
      const validMemberNames = values.memberNames
        ? values.memberNames.filter((name) => name && name.trim() !== '').map((name) => name.trim())
        : [];

      const topicPayload = {
        titleVn: values.titleVn,
        titleEn: values.titleEn,
        researchField: values.researchField,
        researchType: values.researchType,
        durationMonths: Number(values.durationMonths),
        expectedBudget: Number(values.expectedBudget),
        managingDepartmentId: values.managingDepartmentId,
        urgencyStatement: values.urgencyStatement,
        generalObjective: values.generalObjective,
        specificObjectives: values.specificObjectives,
        researchApproach: values.researchApproach,
        researchMethods: values.researchMethods,
        researchScope: values.researchScope,
        implementationPlan: values.implementationPlan || null,
        expectedProductsType1: values.expectedProductsType1 || null,
        expectedProductsType2: values.expectedProductsType2 || null,
        trainingPlan: values.trainingPlan || null,
        budgetExplanation: values.budgetExplanation || null,
        memberNames: validMemberNames,
      };

      const createRes = await topicsApi.create(topicPayload);
      const topicId = createRes.data?.topicId;

      if (proposalFile && topicId) {
        try {
          await topicsApi.uploadAttachment(topicId, proposalFile);
        } catch {
          addToast({
            type: 'warning',
            message: 'Đề tài đã tạo nhưng tải tệp thất bại. Bạn có thể tải lại từ trang chi tiết.',
          });
        }
      }

      addToast({ type: 'success', message: 'Đề tài đã được tạo thành công.' });
      navigate(`/researcher/topics/${topicId}`);
    } catch (err) {
      if (err.response?.status === 400) {
        applyFieldErrors(err, setError);
        const errFields = err.response?.data?.errors;
        if (Array.isArray(errFields)) {
          for (let i = 0; i < STEP_FIELDS.length; i++) {
            if (errFields.some((e) => STEP_FIELDS[i].includes(e.field))) {
              setCurrentStep(i);
              break;
            }
          }
        }
      } else if (err.response?.status === 409) {
        addToast({
          type: 'error',
          message: err.response?.data?.message ?? 'Tên đề tài trùng lặp với đề tài đã tồn tại. Vui lòng chỉnh sửa tiêu đề.',
          duration: 8000,
        });
        setCurrentStep(0);
      } else if (err.response) {
        addToast({
          type: 'error',
          message: `Nộp đề tài thất bại. Máy chủ phản hồi lỗi ${err.response.status}. Vui lòng thử lại.`,
        });
      } else {
        addToast({
          type: 'error',
          message: 'Nộp đề tài thất bại. Không thể kết nối đến máy chủ.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký Đề tài Nghiên cứu Khoa học</h1>
      <p className="text-sm text-gray-500 mb-6">Hoàn thành các bước bên dưới để nộp hồ sơ đề tài mới.</p>

      <FormStepper steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {currentStep === 0 && (
          <StepAdmin
            register={register}
            errors={errors}
            departments={departments}
            researchFieldOptions={(enums.researchField?.length ? enums.researchField : FALLBACK_RESEARCH_FIELDS)}
            researchTypeOptions={(enums.researchType?.length ? enums.researchType : FALLBACK_RESEARCH_TYPES)}
          />
        )}
        {currentStep === 1 && <StepObjectives control={control} errors={errors} />}
        {currentStep === 2 && <StepMethodology control={control} register={register} errors={errors} watch={watch} />}
        {currentStep === 3 && <StepProductsBudget control={control} errors={errors} />}
        {currentStep === 4 && (
          <StepPersonnelAndAttachments 
            watch={watch} 
            setValue={setValue} 
            userClaims={userClaims}
            file={proposalFile} 
            onFileSelect={setProposalFile} 
            onRemove={() => setProposalFile(null)} 
          />
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
          <button type="button" onClick={goBack} disabled={currentStep === 0}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition">
            Quay lại
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button type="button" onClick={goNext}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a5ea8] rounded-lg hover:bg-[#15306a] shadow-sm transition">
              Tiếp theo
            </button>
          ) : (
            <button type="button" onClick={onSubmit} disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition flex items-center gap-2">
              {isSubmitting ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Đang nộp...</>
              ) : 'Gửi duyệt'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Step 0: Administrative Information ===== */
function StepAdmin({ register, errors, departments, researchFieldOptions, researchTypeOptions }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên đề tài (Tiếng Việt) <span className="text-red-500">*</span></label>
        <input {...register('titleVn')} className={`w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.titleVn ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`} />
        {errors.titleVn && <p className="text-xs text-red-500 mt-1">{errors.titleVn.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên đề tài (Tiếng Anh) <span className="text-red-500">*</span></label>
        <input {...register('titleEn')} className={`w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.titleEn ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`} />
        {errors.titleEn && <p className="text-xs text-red-500 mt-1">{errors.titleEn.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lĩnh vực nghiên cứu <span className="text-red-500">*</span></label>
        <select {...register('researchField')} className={`w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.researchField ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`}>
          <option value="">-- Chọn lĩnh vực --</option>
          {researchFieldOptions.map((f) => (<option key={f} value={f}>{f}</option>))}
        </select>
        {errors.researchField && <p className="text-xs text-red-500 mt-1">{errors.researchField.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại hình nghiên cứu <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-4 mt-2.5">
          {researchTypeOptions.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" {...register('researchType')} value={t} className="text-[#1a5ea8] focus:ring-[#1a5ea8]" />
              <span className="text-gray-700">{RESEARCH_TYPE_LABELS[t] ?? t}</span>
            </label>
          ))}
        </div>
        {errors.researchType && <p className="text-xs text-red-500 mt-1">{errors.researchType.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời gian thực hiện (tháng) <span className="text-red-500">*</span></label>
        <input type="number" {...register('durationMonths')} className={`w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.durationMonths ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`} />
        {errors.durationMonths && <p className="text-xs text-red-500 mt-1">{errors.durationMonths.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đơn vị quản lý <span className="text-red-500">*</span></label>
        <select {...register('managingDepartmentId')} className={`w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.managingDepartmentId ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`}>
          <option value="">-- Chọn khoa/phòng ban --</option>
          {departments.map((d) => (<option key={d.departmentId} value={String(d.departmentId)}>{d.departmentName}</option>))}
        </select>
        {errors.managingDepartmentId && <p className="text-xs text-red-500 mt-1">{errors.managingDepartmentId.message}</p>}
      </div>
    </div>
  );
}

/* ===== Step 1: Objectives ===== */
function StepObjectives({ control, errors }) {
  return (
    <div className="space-y-6">
      <Controller name="urgencyStatement" control={control} render={({ field }) => (
        <RichTextEditor label="Tính cấp thiết của đề tài *" value={field.value} onChange={field.onChange} minLength={50} error={errors.urgencyStatement?.message} />
      )} />
      <Controller name="generalObjective" control={control} render={({ field }) => (
        <RichTextEditor label="Mục tiêu tổng quát *" value={field.value} onChange={field.onChange} minLength={50} error={errors.generalObjective?.message} />
      )} />
      <Controller name="specificObjectives" control={control} render={({ field }) => (
        <RichTextEditor label="Mục tiêu cụ thể *" value={field.value} onChange={field.onChange} minLength={50} error={errors.specificObjectives?.message} />
      )} />
    </div>
  );
}

/* ===== Step 2: Methodology ===== */
function StepMethodology({ control, register, errors, watch }) {
  return (
    <div className="space-y-6">
      <Controller name="researchApproach" control={control} render={({ field }) => (
        <RichTextEditor label="Cách tiếp cận nghiên cứu *" value={field.value} onChange={field.onChange} minLength={30} error={errors.researchApproach?.message} />
      )} />
      <Controller name="researchMethods" control={control} render={({ field }) => (
        <RichTextEditor label="Phương pháp nghiên cứu *" value={field.value} onChange={field.onChange} minLength={30} error={errors.researchMethods?.message} />
      )} />
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đối tượng và phạm vi nghiên cứu *</label>
        <textarea {...register('researchScope')} rows={4} className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.researchScope ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`} />
        <div className="flex justify-between text-xs mt-1">
          {errors.researchScope && <span className="text-red-500">{errors.researchScope.message}</span>}
          <span className="text-gray-400 ml-auto">{(watch('researchScope') || '').length}/2000</span>
        </div>
      </div>
      <Controller name="implementationPlan" control={control} render={({ field }) => (
        <RichTextEditor label="Kế hoạch triển khai (không bắt buộc)" value={field.value} onChange={field.onChange} minLength={0} error={errors.implementationPlan?.message} />
      )} />
    </div>
  );
}

/* ===== Step 3: Products & Budget ===== */
function StepProductsBudget({ control, errors }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-3 mb-4">
        <h3 className="text-lg font-bold text-[#1a5ea8]">Sản phẩm dự kiến</h3>
        <p className="text-xs text-gray-500 mt-1">Mô tả các sản phẩm khoa học dự kiến đạt được từ đề tài nghiên cứu.</p>
      </div>

      <Controller name="expectedProductsType1" control={control} render={({ field }) => (
        <RichTextEditor
          label="Sản phẩm khoa học Dạng I (Bài báo, sách chuyên khảo, báo cáo khoa học)"
          value={field.value} onChange={field.onChange} minLength={0}
          error={errors.expectedProductsType1?.message}
        />
      )} />

      <Controller name="expectedProductsType2" control={control} render={({ field }) => (
        <RichTextEditor
          label="Sản phẩm khoa học Dạng II (Sáng chế, giải pháp hữu ích, phần mềm, quy trình)"
          value={field.value} onChange={field.onChange} minLength={0}
          error={errors.expectedProductsType2?.message}
        />
      )} />

      <Controller name="trainingPlan" control={control} render={({ field }) => (
        <RichTextEditor
          label="Kế hoạch đào tạo (Thạc sĩ, Tiến sĩ, Sinh viên NCKH)"
          value={field.value} onChange={field.onChange} minLength={0}
          error={errors.trainingPlan?.message}
        />
      )} />

      <div className="border-t border-gray-100 pt-6 mt-4">
        <h3 className="text-lg font-bold text-[#1a5ea8] mb-4">Kinh phí thực hiện</h3>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tổng kinh phí dự kiến (VND) <span className="text-red-500">*</span></label>
          <Controller name="expectedBudget" control={control} render={({ field }) => (
            <NumericFormat
              value={field.value}
              onValueChange={(vals) => field.onChange(vals.floatValue)}
              thousandSeparator=","
              suffix=" VND"
              decimalScale={0}
              className={`w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#1a5ea8]/20 transition ${errors.expectedBudget ? 'border-red-500' : 'border-gray-300 focus:border-[#1a5ea8]'}`}
              placeholder="Ví dụ: 50,000,000 VND"
            />
          )} />
          {errors.expectedBudget && <p className="text-xs text-red-500 mt-1">{errors.expectedBudget.message}</p>}
        </div>

        <Controller name="budgetExplanation" control={control} render={({ field }) => (
          <RichTextEditor
            label="Dự toán kinh phí chi tiết (phân bổ theo hạng mục)"
            value={field.value} onChange={field.onChange} minLength={0}
            error={errors.budgetExplanation?.message}
          />
        )} />
      </div>
    </div>
  );
}

/* ===== Step 4: Personnel & Attachments ===== */
function StepPersonnelAndAttachments({ watch, setValue, userClaims, file, onFileSelect, onRemove }) {
  const memberNames = watch('memberNames') || [];

  const addMember = () => {
    setValue('memberNames', [...memberNames, '']);
  };

  const removeMember = (indexToRemove) => {
    const newArr = [...memberNames];
    newArr.splice(indexToRemove, 1);
    setValue('memberNames', newArr);
  };

  const updateMember = (index, value) => {
    const newArr = [...memberNames];
    newArr[index] = value;
    setValue('memberNames', newArr);
  };

  return (
    <div className="space-y-8">
      
      {/* ── Khu vực Nhân sự ── */}
      <div>
        <h3 className="text-lg font-bold text-[#1a5ea8] border-b border-gray-100 pb-3 mb-5">Nhân sự thực hiện</h3>
        
        {/* Chủ nhiệm */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-700 mb-3">Chủ nhiệm đề tài</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Họ và tên</label>
              <input readOnly value={userClaims?.fullName || ''} className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm text-gray-600 font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vai trò</label>
              <input readOnly value="Chủ nhiệm" className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm text-gray-600 font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email liên hệ</label>
              <input readOnly value={userClaims?.email || ''} className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm text-gray-600 font-semibold focus:outline-none truncate" />
            </div>
          </div>
        </div>

        {/* Thành viên */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3">Thành viên tham gia</p>
          {memberNames.length === 0 ? (
             <p className="text-sm text-gray-400 italic mb-4 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center">
               Chưa có thành viên nào được thêm. Đề tài sẽ do Chủ nhiệm thực hiện độc lập.
             </p>
          ) : (
             <div className="space-y-3 mb-4">
               {memberNames.map((memberName, idx) => {
                 return (
                   <div key={idx} className="flex flex-col md:flex-row items-end gap-3 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                     <div className="flex-1 w-full">
                       <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Họ và tên thành viên</label>
                       <input
                         type="text"
                         value={memberName}
                         onChange={(e) => updateMember(idx, e.target.value)}
                         className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-[#1a5ea8]/20 focus:border-[#1a5ea8] transition"
                         placeholder="Nhập họ và tên thành viên"
                       />
                     </div>
                     <div className="w-full md:w-[150px]">
                       <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vai trò</label>
                       <input readOnly value="Thành viên" className="w-full h-10 bg-gray-100 border border-gray-200 rounded-lg px-3 text-sm text-gray-500 font-medium focus:outline-none" />
                     </div>
                     <button type="button" onClick={() => removeMember(idx)} className="h-10 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-bold transition flex items-center justify-center flex-shrink-0 w-full md:w-auto">
                       Xóa
                     </button>
                   </div>
                 )
               })}
             </div>
          )}
          <button type="button" onClick={addMember} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Thêm thành viên tham gia
          </button>
        </div>
      </div>

      {/* ── Khu vực Tài liệu đính kèm ── */}
      <div className="border-t border-gray-100 pt-8 mt-4">
        <h3 className="text-lg font-bold text-[#1a5ea8] mb-4">Tài liệu đính kèm</h3>
        <DragDropZone file={file} onFileSelect={onFileSelect} onRemove={onRemove} />
        <div className="mt-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs font-medium text-amber-800 leading-relaxed">
            <strong className="font-bold">Lưu ý:</strong> Vui lòng tải lên bản Thuyết minh đề tài toàn văn theo mẫu chuẩn của Bộ KH&CN. <br/>
            Định dạng cho phép: <span className="font-bold">PDF, DOC, DOCX</span>. Dung lượng tối đa: <span className="font-bold">15MB</span>.
          </p>
        </div>
      </div>

    </div>
  );
}