import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export default function DragDropZone({ file, onFileSelect, onRemove, error, maxSize = 10 * 1024 * 1024 }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFileSelect(accepted[0]);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize,
    multiple: false,
  });

  return (
    <div className="space-y-1">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Xóa tệp
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.837 3.574A3.75 3.75 0 0118 19.5H6.75z" />
            </svg>
            <p className="text-sm text-gray-600">Kéo thả hoặc nhấn để chọn tệp</p>
            <p className="text-xs text-gray-400">PDF, DOC, DOCX — tối đa 10 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
