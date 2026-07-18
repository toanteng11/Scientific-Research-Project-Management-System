import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { councilsApi } from '../../api/councils.api';
import useUiStore from '../../store/uiStore';
import { applyFieldErrors } from '../../utils/errorHandler';

const schema = yup.object({
  councilName: yup.string().required('Bắt buộc').max(200),
  meetingDate: yup.string().required('Bắt buộc'),
  meetingTime: yup.string().required('Bắt buộc'),
  meetingLocation: yup.string().required('Bắt buộc').max(300),
});

export default function CouncilCreatePage() {
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await councilsApi.create(data);
      addToast({ type: 'success', message: 'Hội đồng đã được tạo thành công.' });
      navigate(`/manager/councils/${res.data?.councilId}`);
    } catch (err) {
      if (err.response?.status === 400) applyFieldErrors(err, setError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/manager/councils')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Quay lại</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo Hội đồng mới</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hội đồng *</label>
          <input {...register('councilName')} className={`w-full border rounded-md px-3 py-2 text-sm ${errors.councilName ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.councilName && <p className="text-xs text-red-500 mt-1">{errors.councilName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày họp *</label>
            <input type="date" {...register('meetingDate')} className={`w-full border rounded-md px-3 py-2 text-sm ${errors.meetingDate ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.meetingDate && <p className="text-xs text-red-500 mt-1">{errors.meetingDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ họp *</label>
            <input type="time" {...register('meetingTime')} className={`w-full border rounded-md px-3 py-2 text-sm ${errors.meetingTime ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.meetingTime && <p className="text-xs text-red-500 mt-1">{errors.meetingTime.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm *</label>
          <input {...register('meetingLocation')} className={`w-full border rounded-md px-3 py-2 text-sm ${errors.meetingLocation ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.meetingLocation && <p className="text-xs text-red-500 mt-1">{errors.meetingLocation.message}</p>}
        </div>

        {errors.root && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errors.root.message}</div>}

        <button type="submit" disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
          {submitting ? 'Đang tạo...' : 'Tạo Hội đồng'}
        </button>
      </form>
    </div>
  );
}
