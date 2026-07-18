/**
 * Accessible loading indicator (WCAG 4.1.3 status message).
 * Decorative spinner element is hidden from assistive technology; label is exposed via sr-only text.
 */
export default function LoadingSpinner({
  label = 'Đang tải',
  className = '',
  sizeClass = 'h-8 w-8',
  borderClass = 'border-b-2 border-blue-600',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex justify-center items-center ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div
        className={`animate-spin rounded-full ${sizeClass} ${borderClass}`}
        aria-hidden="true"
      />
    </div>
  );
}
