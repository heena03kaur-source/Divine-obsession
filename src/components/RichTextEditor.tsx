import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, readOnly = false }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      ['code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'align',
    'list', 'bullet', 'check',
    'code-block'
  ];

  return (
    <div className="bg-white rounded-md border border-[#7DB095]/20 hover:border-[#7DB095]/40 transition duration-200 rich-text-wrapper overflow-hidden">
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Start writing...'}
        readOnly={readOnly}
        className="font-sans text-gray-800"
      />
      <style>{`
        .rich-text-wrapper .ql-toolbar {
          border: none;
          border-bottom: 1px solid rgba(125, 176, 149, 0.2);
          background-color: #FAF9F6;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .rich-text-wrapper .ql-container {
          border: none;
          font-family: inherit;
          font-size: 1rem;
        }
        .rich-text-wrapper .ql-editor {
          min-height: 120px;
          padding: 1rem;
        }
        .rich-text-wrapper .ql-editor p {
          margin-bottom: 0.75em;
        }
        .rich-text-wrapper .ql-editor h1, 
        .rich-text-wrapper .ql-editor h2, 
        .rich-text-wrapper .ql-editor h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
        }
        .rich-text-wrapper .ql-editor blockquote {
          border-left: 4px solid #7DB095;
          padding-left: 1rem;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
