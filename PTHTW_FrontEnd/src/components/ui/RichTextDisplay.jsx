import DOMPurify from 'dompurify';

/**
 * Safely renders sanitized HTML content using Tailwind Typography classes.
 * Strips all dangerous attributes/tags (XSS) while preserving formatting
 * produced by TipTap (bold, italic, lists, headings).
 */
export default function RichTextDisplay({ html, className = '' }) {
  if (!html || html === '<p></p>') return null;

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return (
    <div
      className={`prose prose-sm max-w-none prose-gray ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
