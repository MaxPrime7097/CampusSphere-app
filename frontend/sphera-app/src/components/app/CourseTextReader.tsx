import React, { useState, useEffect } from 'react';
import { Edit3, Eye, Copy, Check, Save, Loader2, FileText, Clock, Sparkles } from 'lucide-react';

interface CourseTextReaderProps {
  initialText: string;
  title?: string;
  isEditable?: boolean;
  onSave?: (newText: string) => Promise<void> | void;
}

export function CourseTextReader({
  initialText,
  title,
  isEditable = false,
  onSave,
}: CourseTextReaderProps) {
  const [text, setText] = useState(initialText || '');
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setText(initialText || '');
  }, [initialText]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(text);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setMode('view');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Simple, robust Markdown-to-JSX renderer
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`${keyPrefix}-list`} className="my-3 space-y-1.5 pl-4 list-disc marker:text-sphera-green">
            {listBuffer.map((item, idx) => (
              <li key={idx} className="text-white/85 text-sm leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        listBuffer = [];
      }
    };

    const renderInline = (line: string): React.ReactNode[] => {
      // Parse bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Bullet list item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        listBuffer.push(trimmed.slice(2));
        return;
      }

      // If we were buffering a list, flush it
      flushList(`line-${idx}`);

      // Headings
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl sm:text-2xl font-bold font-display text-white mt-6 mb-3 pb-2 border-b border-sphera-border">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-lg sm:text-xl font-bold font-display text-sphera-green mt-5 mb-2">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-base font-semibold text-white mt-4 mb-1.5">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} className="my-3 pl-4 border-l-2 border-sphera-green/50 text-white/70 italic text-sm">
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
      } else if (trimmed === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(
          <p key={idx} className="text-sm leading-relaxed text-white/85 my-1.5">
            {renderInline(line)}
          </p>
        );
      }
    });

    flushList('final');
    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] relative">
      {/* Reader Toolbar */}
      <div className="h-12 border-b border-sphera-border bg-sphera-surface-2/80 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-xs text-sphera-text-muted">
          <span className="flex items-center gap-1 font-mono">
            <FileText className="w-3.5 h-3.5 text-sphera-green" />
            {wordCount} mots
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            ~{readTimeMin} min
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-sphera-green animate-fade-in font-medium mr-1">
              <Check className="w-3.5 h-3.5" />
              Enregistré
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-bg transition-colors"
            title="Copier le texte"
          >
            {copied ? <Check className="w-4 h-4 text-sphera-green" /> : <Copy className="w-4 h-4" />}
          </button>

          {isEditable && (
            mode === 'view' ? (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sphera-bg border border-sphera-border text-sphera-text-muted hover:text-white hover:border-sphera-green/50 text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-sphera-green" />
                <span>Modifier</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sphera-text-muted hover:text-white text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aperçu</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sphera-green text-black text-xs font-bold hover:bg-sphera-green/90 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Content View or Edit Textarea */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {mode === 'view' ? (
          <div className="max-w-prose mx-auto">
            {title && (
              <div className="mb-4 pb-2 border-b border-sphera-border/50">
                <h1 className="text-xl font-bold text-white font-display">{title}</h1>
              </div>
            )}
            <div className="text-white/90">
              {renderFormattedContent(text)}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full flex-1 bg-transparent text-white text-sm focus:outline-none leading-relaxed resize-none font-mono p-2 custom-scrollbar"
              placeholder="Écrivez ou modifiez votre cours ici..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
