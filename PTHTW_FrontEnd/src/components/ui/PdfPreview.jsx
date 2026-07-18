export default function PdfPreview({ fileUrl, title = 'PDF document' }) {
  if (!fileUrl) return null;

  return (
    <iframe
      title={title}
      src={fileUrl}
      className="h-full w-full border-0 bg-white"
    />
  );
}
