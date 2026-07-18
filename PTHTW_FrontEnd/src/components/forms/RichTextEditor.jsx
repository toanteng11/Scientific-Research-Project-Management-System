import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useState } from 'react';

export default function RichTextEditor({ value, onChange, label, minLength = 0, error }) {
  // useState drives the character counter display through React's render cycle.
  // This eliminates the ref-based DOM mutation pattern whose root failure was
  // that onCreate fires before the JSX ref attaches to the span element,
  // leaving the initial count permanently at 0 on first paint.
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      if (typeof onChange === 'function') {
        onChange(ed.getHTML());
      }
      setCharCount(ed.storage.characterCount.characters());
    },
    onCreate: ({ editor: ed }) => {
      setCharCount(ed.storage.characterCount.characters());
    },
  });

  // Sync external value prop into editor when it changes from outside
  // (e.g., form reset, data load from API).
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      queueMicrotask(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(value || '', false);
          setCharCount(editor.storage.characterCount.characters());
        }
      });
    }
  }, [value, editor]);

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className={`border rounded-md overflow-hidden ${error ? 'border-red-500' : 'border-gray-300'}`}>
        {editor && (
          <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
            <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="B" className="font-bold" />
            <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="I" className="italic" />
            <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="&bull;" />
            <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1." />
            <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" />
          </div>
        )}
        <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[120px] focus-within:ring-2 focus-within:ring-blue-500" />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={charCount < minLength ? 'text-red-500' : 'text-gray-400'}>
          {charCount} ký tự{minLength > 0 ? ` (tối thiểu ${minLength})` : ''}
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, label, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs ${className} ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );
}
