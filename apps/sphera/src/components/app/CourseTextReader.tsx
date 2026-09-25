import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Edit3, Eye, Copy, Check, Save, Loader2, FileText, Clock,
  Search, X, ChevronDown, ChevronUp, BookOpen, Lightbulb,
  AlertTriangle, List, ArrowDown, ArrowUp, Type, Compass,
  Bookmark, Hash, Sparkles
} from 'lucide-react';
import { TextSelectionToolbar, type SelectionActionType } from './TextSelectionToolbar';

interface CourseTextReaderProps {
  initialText: string;
  title?: string;
  isEditable?: boolean;
  onSave?: (newText: string) => Promise<void> | void;
  onSelectionAction?: (action: SelectionActionType, text: string) => void;
}

type FontSize = 'sm' | 'base' | 'lg' | 'xl';

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'callout' | 'list' | 'numbered-list' | 'table' | 'quote' | 'code' | 'formula' | 'paragraph';
  content: string;
  raw?: string;
  calloutType?: 'definition' | 'remarque' | 'exemple' | 'theoreme' | 'important';
  calloutTitle?: string;
  items?: string[];
  tableRows?: string[][];
  id?: string;
}

interface TocItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
}

export function CourseTextReader({
  initialText,
  title,
  isEditable = false,
  onSave,
  onSelectionAction,
}: CourseTextReaderProps) {
  const [text, setText] = useState(initialText || '');
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reading Experience State
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{ coords: { x: number; y: number }; text: string } | null>(null);

  useEffect(() => {
    setText(initialText || '');
  }, [initialText]);

  // Track scroll progress
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)));
    }
  };

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

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

  // Font size classes
  const fontSizeClasses: Record<FontSize, { p: string; h1: string; h2: string; h3: string }> = {
    sm: { p: 'text-xs leading-relaxed', h1: 'text-lg', h2: 'text-base', h3: 'text-sm' },
    base: { p: 'text-sm leading-relaxed', h1: 'text-xl', h2: 'text-lg', h3: 'text-base' },
    lg: { p: 'text-base leading-relaxed', h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg' },
    xl: { p: 'text-lg leading-loose', h1: 'text-3xl', h2: 'text-2xl', h3: 'text-xl' },
  };

  const cycleFontSize = () => {
    const order: FontSize[] = ['sm', 'base', 'lg', 'xl'];
    const nextIdx = (order.indexOf(fontSize) + 1) % order.length;
    setFontSize(order[nextIdx]);
  };

  // Smart Parser: structures raw text (extracted from PDF / courses) into rich blocks
  const { blocks, toc } = useMemo(() => {
    if (!text) return { blocks: [], toc: [] };

    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const parsedBlocks: ParsedBlock[] = [];
    const tocItems: TocItem[] = [];

    let currentParagraph: string[] = [];
    let currentList: string[] = [];
    let currentNumberedList: string[] = [];
    let currentTable: string[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let blockIdCounter = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        parsedBlocks.push({
          type: 'paragraph',
          content: currentParagraph.join(' '),
        });
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        parsedBlocks.push({
          type: 'list',
          content: '',
          items: [...currentList],
        });
        currentList = [];
      }
    };

    const flushNumberedList = () => {
      if (currentNumberedList.length > 0) {
        parsedBlocks.push({
          type: 'numbered-list',
          content: '',
          items: [...currentNumberedList],
        });
        currentNumberedList = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length > 0) {
        const rows = currentTable
          .map(r => r.split('|').map(c => c.trim()).filter((c, idx, arr) => !(c === '' && (idx === 0 || idx === arr.length - 1))))
          .filter(r => r.length > 0 && !r.every(c => /^[-:\s]+$/.test(c)));
        if (rows.length > 0) {
          parsedBlocks.push({
            type: 'table',
            content: '',
            tableRows: rows,
          });
        }
        currentTable = [];
      }
    };

    const flushAll = () => {
      flushParagraph();
      flushList();
      flushNumberedList();
      flushTable();
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Fenced code block detection
      if (trimmed.startsWith('```')) {
        flushAll();
        if (inCodeBlock) {
          parsedBlocks.push({
            type: 'code',
            content: codeBuffer.join('\n'),
          });
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Empty line
      if (!trimmed) {
        flushAll();
        continue;
      }

      // Markdown Table
      if (trimmed.startsWith('|') && trimmed.includes('|')) {
        flushParagraph();
        flushList();
        flushNumberedList();
        currentTable.push(trimmed);
        continue;
      } else {
        flushTable();
      }

      // Explicit Markdown Headings
      if (trimmed.startsWith('# ')) {
        flushAll();
        const titleText = trimmed.replace(/^#\s+/, '').trim();
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h1', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 1 });
        continue;
      }

      if (trimmed.startsWith('## ')) {
        flushAll();
        const titleText = trimmed.replace(/^##\s+/, '').trim();
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h2', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 2 });
        continue;
      }

      if (trimmed.startsWith('### ')) {
        flushAll();
        const titleText = trimmed.replace(/^###\s+/, '').trim();
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h3', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 3 });
        continue;
      }

      // Academic Chapter / Part Detection in raw text
      const chapMatch = trimmed.match(/^(CHAPITRE|Chapitre|PARTIE|Partie|MODULE|Module)\s+([0-9IVXLCDM]+)[\s:\.\-—]+(.*)$/i);
      if (chapMatch) {
        flushAll();
        const titleText = trimmed;
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h1', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 1 });
        continue;
      }

      // Academic Section Detection in raw text
      const secMatch = trimmed.match(/^(SECTION|Section|SOUS-PARTIE)\s+([0-9IVXLCDM\.]+)[\s:\.\-—]+(.*)$/i);
      if (secMatch) {
        flushAll();
        const titleText = trimmed;
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h2', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 2 });
        continue;
      }

      // Roman Numerals Section Detection (e.g. "I. Introduction", "II - Principes")
      const romanMatch = trimmed.match(/^([IVXLCDM]+)[\.\-\:\)]\s+([A-ZÀ-Ÿ].+)$/);
      if (romanMatch && trimmed.length < 90) {
        flushAll();
        const titleText = trimmed;
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h2', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 2 });
        continue;
      }

      // Numeric Subsection Detection (e.g. "1.1 Définitions", "2.3.4 Formule")
      const numDotMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+([A-ZÀ-Ÿ].+)$/);
      if (numDotMatch && trimmed.length < 90) {
        flushAll();
        const titleText = trimmed;
        const id = `heading-${++blockIdCounter}`;
        const level = numDotMatch[2] ? 3 : 2;
        parsedBlocks.push({ type: level === 3 ? 'h3' : 'h2', content: titleText, id });
        tocItems.push({ id, title: titleText, level });
        continue;
      }

      // Single numbered section heading (e.g. "1. Notions générales" when short and capitalized)
      const numSingleMatch = trimmed.match(/^(\d+)[\.\-\)]\s+([A-ZÀ-Ÿ][a-zà-ÿA-ZÀ-Ÿ\s]{3,60})$/);
      if (numSingleMatch && !trimmed.endsWith('.') && trimmed.length < 70) {
        flushAll();
        const titleText = trimmed;
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h2', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 2 });
        continue;
      }

      // Standalone UPPERCASE heading detection (e.g. "MODULATION D'IMPULSION CODEE (MIC)")
      const isAllCaps = /^([A-ZÀ-Ÿ0-9\s\(\)\/,\-—:]{6,65})$/.test(trimmed) &&
        trimmed.split(' ').length <= 8 &&
        !trimmed.endsWith('.') &&
        !trimmed.endsWith(':');
      if (isAllCaps) {
        flushAll();
        const titleText = trimmed;
        const id = `heading-${++blockIdCounter}`;
        parsedBlocks.push({ type: 'h2', content: titleText, id });
        tocItems.push({ id, title: titleText, level: 2 });
        continue;
      }

      // Callout Detection (Definitions, Examples, Notes, Theorems, Warnings)
      const calloutDefMatch = trimmed.match(/^(D[ée]finition\s*\d*)\s*[\:\-—]\s*(.*)$/i);
      if (calloutDefMatch) {
        flushAll();
        parsedBlocks.push({
          type: 'callout',
          calloutType: 'definition',
          calloutTitle: calloutDefMatch[1].trim(),
          content: calloutDefMatch[2].trim(),
        });
        continue;
      }

      const calloutRemMatch = trimmed.match(/^(Remarque\s*\d*|Note|N\.B\.)\s*[\:\-—]\s*(.*)$/i);
      if (calloutRemMatch) {
        flushAll();
        parsedBlocks.push({
          type: 'callout',
          calloutType: 'remarque',
          calloutTitle: calloutRemMatch[1].trim(),
          content: calloutRemMatch[2].trim(),
        });
        continue;
      }

      const calloutExMatch = trimmed.match(/^(Exemple\s*\d*)\s*[\:\-—]\s*(.*)$/i);
      if (calloutExMatch) {
        flushAll();
        parsedBlocks.push({
          type: 'callout',
          calloutType: 'exemple',
          calloutTitle: calloutExMatch[1].trim(),
          content: calloutExMatch[2].trim(),
        });
        continue;
      }

      const calloutThMatch = trimmed.match(/^(Th[ée]or[èe]me\s*\d*|Propri[ée]t[ée]\s*\d*|Formule|Principe)\s*[\:\-—]\s*(.*)$/i);
      if (calloutThMatch) {
        flushAll();
        parsedBlocks.push({
          type: 'callout',
          calloutType: 'theoreme',
          calloutTitle: calloutThMatch[1].trim(),
          content: calloutThMatch[2].trim(),
        });
        continue;
      }

      const calloutImpMatch = trimmed.match(/^(Important|Attention|Alerte|[AÀ]\s*retenir)\s*[\:\-—]\s*(.*)$/i);
      if (calloutImpMatch) {
        flushAll();
        parsedBlocks.push({
          type: 'callout',
          calloutType: 'important',
          calloutTitle: calloutImpMatch[1].trim(),
          content: calloutImpMatch[2].trim(),
        });
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        flushAll();
        parsedBlocks.push({
          type: 'quote',
          content: trimmed.slice(2).trim(),
        });
        continue;
      }

      // Isolated Formula Detection (starts with $$ or has clear math syntax)
      if ((trimmed.startsWith('$$') && trimmed.endsWith('$$')) || (trimmed.startsWith('\\[') && trimmed.endsWith('\\]'))) {
        flushAll();
        parsedBlocks.push({
          type: 'formula',
          content: trimmed,
        });
        continue;
      }

      // Bullet List item
      if (/^[-*•◦▪–]\s+/.test(trimmed)) {
        flushParagraph();
        flushNumberedList();
        currentList.push(trimmed.replace(/^[-*•◦▪–]\s+/, ''));
        continue;
      }

      // Numbered List item
      if (/^\d+[\.\)]\s+/.test(trimmed)) {
        flushParagraph();
        flushList();
        currentNumberedList.push(trimmed.replace(/^\d+[\.\)]\s+/, ''));
        continue;
      }

      // If we reach here, it's a paragraph line.
      // Heal broken sentences: if previous line ended without sentence terminator, combine them!
      flushList();
      flushNumberedList();

      if (currentParagraph.length === 0) {
        currentParagraph.push(trimmed);
      } else {
        const last = currentParagraph[currentParagraph.length - 1];
        const endsTerminal = /[.!?:;]$/.test(last);
        if (endsTerminal) {
          // If previous sentence ended, and next line starts with lowercase, it might still belong to same paragraph
          // We push as continuation of the paragraph
          currentParagraph.push(trimmed);
        } else {
          // Definitely continuation of broken sentence
          currentParagraph.push(trimmed);
        }
      }
    }

    flushAll();
    return { blocks: parsedBlocks, toc: tocItems };
  }, [text]);

  // Highlight search matches
  const renderHighlightedText = useCallback((contentStr: string) => {
    if (!contentStr) return null;

    // First process bold **text** and inline code `code`
    const renderInlineMarkdown = (chunk: string): React.ReactNode[] => {
      const parts = chunk.split(/(\*\*.*?\*\*|`.*?`)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-white">
              {renderSearchHighlight(part.slice(2, -2))}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={pIdx} className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-xs">
              {renderSearchHighlight(part.slice(1, -1))}
            </code>
          );
        }
        return <React.Fragment key={pIdx}>{renderSearchHighlight(part)}</React.Fragment>;
      });
    };

    const renderSearchHighlight = (plainText: string): React.ReactNode => {
      if (!searchQuery.trim()) return plainText;

      const q = searchQuery.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const segments = plainText.split(regex);

      if (segments.length === 1) return plainText;

      return segments.map((seg, sIdx) => {
        if (seg.toLowerCase() === q.toLowerCase()) {
          return (
            <mark
              key={sIdx}
              className="bg-[#ff9800] text-black font-semibold rounded px-1 py-0.5 shadow-sm"
            >
              {seg}
            </mark>
          );
        }
        return seg;
      });
    };

    return renderInlineMarkdown(contentStr);
  }, [searchQuery]);

  // Match count in text
  const matchCount = useMemo(() => {
    if (!searchQuery.trim() || !text) return 0;
    const escaped = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(escaped, 'gi'));
    return matches ? matches.length : 0;
  }, [searchQuery, text]);

  // Scroll to heading
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeadingId(id);
      setIsTocOpen(false);
    }
  };

  const handleTextSelection = () => {
    if (mode !== 'view') {
      setSelectionToolbar(null);
      return;
    }
    setTimeout(() => {
      const selection = window.getSelection();
      const selected = selection?.toString().trim();
      if (selected && selected.length >= 3) {
        try {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect && (rect.width > 0 || rect.height > 0)) {
            setSelectionToolbar({
              coords: { x: rect.left + rect.width / 2, y: rect.top },
              text: selected,
            });
            return;
          }
        } catch {
          // ignore
        }
      }
      setSelectionToolbar(null);
    }, 10);
  };

  const handleAction = (action: SelectionActionType, selectedText: string) => {
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    onSelectionAction?.(action, selectedText);
  };

  return (
    <div className="flex flex-col h-full bg-[#141416] relative selection:bg-emerald-500/30 selection:text-white">
      {/* Floating Action Toolbar on Selected Text */}
      {selectionToolbar && (
        <TextSelectionToolbar
          coords={selectionToolbar.coords}
          selectedText={selectionToolbar.text}
          onAction={handleAction}
          onClose={() => setSelectionToolbar(null)}
        />
      )}

      {/* Reading Progress Indicator Bar */}
      <div className="h-1 w-full bg-sphera-surface shrink-0 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sphera-green via-emerald-400 to-teal-400 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Main Reader Navigation Toolbar */}
      <div className="h-13 border-b border-sphera-border/70 bg-sphera-surface-2/90 px-4 flex items-center justify-between shrink-0 gap-3">
        {/* Left: Metadata & Table of Contents Button */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-sphera-text-muted">
          {toc.length > 0 && (
            <button
              type="button"
              onClick={() => setIsTocOpen(v => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isTocOpen
                  ? 'bg-sphera-green text-black border-sphera-green font-bold shadow-sm'
                  : 'bg-sphera-surface hover:bg-sphera-surface-2 text-white border-sphera-border'
              }`}
              title="Afficher le sommaire du cours"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sommaire</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isTocOpen ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                {toc.length}
              </span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-sphera-green" />
              {wordCount.toLocaleString()} mots
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              ~{readTimeMin} min
            </span>
          </div>
        </div>

        {/* Center: Live Search Bar */}
        <div className="flex-1 max-w-xs sm:max-w-sm relative">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-sphera-text-muted absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans le texte..."
              className="w-full pl-8 pr-8 py-1.5 bg-sphera-surface rounded-lg border border-sphera-border text-xs text-white placeholder:text-sphera-text-muted/60 focus:outline-none focus:border-sphera-green/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-sphera-text-muted hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="absolute top-full left-0 mt-1 px-2.5 py-1 rounded bg-zinc-900 border border-sphera-border text-[10px] text-sphera-text-muted flex items-center gap-2 z-20 shadow-lg">
              <span className="font-semibold text-white font-mono">{matchCount}</span> occurrence{matchCount > 1 ? 's' : ''} trouvée{matchCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Right: Reading Controls (Font Size, Copy, Edit) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Font Size Adjuster */}
          <button
            type="button"
            onClick={cycleFontSize}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface border border-sphera-border/50 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Ajuster la taille du texte"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-mono">{fontSize}</span>
          </button>

          {saveSuccess && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-sphera-green font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Enregistré
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface border border-sphera-border/50 transition-colors"
            title="Copier l'intégralité du cours"
          >
            {copied ? <Check className="w-4 h-4 text-sphera-green" /> : <Copy className="w-4 h-4" />}
          </button>

          {isEditable && (
            mode === 'view' ? (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sphera-surface hover:bg-sphera-surface-2 text-white border border-sphera-border transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modifier</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setText(initialText || '');
                    setMode('view');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-sphera-text-muted hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sphera-green text-black hover:bg-green-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Sommaire Dropdown Drawer */}
      {isTocOpen && toc.length > 0 && (
        <div className="absolute top-14 left-4 z-30 w-72 sm:w-80 max-h-[75vh] bg-[#1a1a20] border border-sphera-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-sphera-surface border-b border-sphera-border flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-sphera-green" />
              Sommaire du cours
            </span>
            <button
              type="button"
              onClick={() => setIsTocOpen(false)}
              className="text-sphera-text-muted hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 divide-y divide-sphera-border/30">
            {toc.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={`w-full text-left py-2 px-2.5 rounded-lg text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                  item.level === 1 ? 'font-bold text-white hover:bg-white/10' :
                  item.level === 2 ? 'pl-5 font-semibold text-white/85 hover:bg-white/5' :
                  'pl-8 text-sphera-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  item.level === 1 ? 'bg-sphera-green' :
                  item.level === 2 ? 'bg-emerald-400/70' :
                  'bg-sphera-text-muted'
                }`} />
                <span className="line-clamp-2 leading-snug">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reader Main Content Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-8 py-8"
      >
        {mode === 'view' ? (
          <article className="max-w-3xl mx-auto">
            {/* Editorial Course Header */}
            {title && (
              <div className="mb-8 pb-4 border-b border-sphera-border">
                <div className="flex items-center gap-2 text-xs font-bold text-sphera-green uppercase tracking-wider mb-2">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Document de Cours</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight leading-tight">
                  {title}
                </h1>
              </div>
            )}

            {/* Formatted Content Blocks */}
            <div className={`space-y-4 text-white/90 ${fontSizeClasses[fontSize].p}`}>
              {blocks.map((block, idx) => {
                switch (block.type) {
                  case 'h1':
                    return (
                      <h1
                        key={idx}
                        id={block.id}
                        className={`${fontSizeClasses[fontSize].h1} font-extrabold font-display text-white mt-10 mb-4 pb-2.5 border-b-2 border-sphera-green/40 flex items-center gap-2.5 tracking-tight`}
                      >
                        <span className="w-2 h-5 rounded-full bg-sphera-green" />
                        <span>{renderHighlightedText(block.content)}</span>
                      </h1>
                    );

                  case 'h2':
                    return (
                      <h2
                        key={idx}
                        id={block.id}
                        className={`${fontSizeClasses[fontSize].h2} font-bold font-display text-emerald-400 mt-8 mb-3 flex items-center gap-2 tracking-tight`}
                      >
                        <Hash className="w-4 h-4 text-emerald-500/70 flex-shrink-0" />
                        <span>{renderHighlightedText(block.content)}</span>
                      </h2>
                    );

                  case 'h3':
                    return (
                      <h3
                        key={idx}
                        id={block.id}
                        className={`${fontSizeClasses[fontSize].h3} font-semibold text-white mt-6 mb-2 text-white/95`}
                      >
                        {renderHighlightedText(block.content)}
                      </h3>
                    );

                  case 'callout':
                    if (block.calloutType === 'definition') {
                      return (
                        <div key={idx} className="my-5 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 shadow-sm">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <BookOpen className="w-4 h-4" />
                            <span>{block.calloutTitle || 'Définition'}</span>
                          </div>
                          <div className="text-white/95 leading-relaxed font-medium">
                            {renderHighlightedText(block.content)}
                          </div>
                        </div>
                      );
                    }
                    if (block.calloutType === 'remarque') {
                      return (
                        <div key={idx} className="my-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1.5">
                          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Lightbulb className="w-4 h-4" />
                            <span>{block.calloutTitle || 'Remarque'}</span>
                          </div>
                          <div className="text-white/85 leading-relaxed">
                            {renderHighlightedText(block.content)}
                          </div>
                        </div>
                      );
                    }
                    if (block.calloutType === 'exemple') {
                      return (
                        <div key={idx} className="my-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1.5">
                          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                            <FileText className="w-4 h-4" />
                            <span>{block.calloutTitle || 'Exemple'}</span>
                          </div>
                          <div className="text-white/85 leading-relaxed">
                            {renderHighlightedText(block.content)}
                          </div>
                        </div>
                      );
                    }
                    if (block.calloutType === 'theoreme') {
                      return (
                        <div key={idx} className="my-5 p-4 sm:p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5 shadow-sm">
                          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                            <Compass className="w-4 h-4" />
                            <span>{block.calloutTitle || 'Théorème / Propriété'}</span>
                          </div>
                          <div className="text-white/95 leading-relaxed font-mono font-medium">
                            {renderHighlightedText(block.content)}
                          </div>
                        </div>
                      );
                    }
                    // Important / Warning
                    return (
                      <div key={idx} className="my-4 p-4 rounded-xl bg-[#ff9800]/10 border border-[#ff9800]/30 space-y-1.5">
                        <div className="flex items-center gap-2 text-[#ff9800] text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{block.calloutTitle || 'Important'}</span>
                        </div>
                        <div className="text-white/90 leading-relaxed font-medium">
                          {renderHighlightedText(block.content)}
                        </div>
                      </div>
                    );

                  case 'list':
                    return (
                      <ul key={idx} className="my-3 space-y-2 pl-2">
                        {block.items?.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2.5 text-white/90 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-sphera-green mt-2 flex-shrink-0" />
                            <div className="flex-1">{renderHighlightedText(item)}</div>
                          </li>
                        ))}
                      </ul>
                    );

                  case 'numbered-list':
                    return (
                      <ol key={idx} className="my-3 space-y-2 pl-2">
                        {block.items?.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-3 text-white/90 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-green font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {itemIdx + 1}
                            </span>
                            <div className="flex-1">{renderHighlightedText(item)}</div>
                          </li>
                        ))}
                      </ol>
                    );

                  case 'table':
                    if (!block.tableRows || block.tableRows.length === 0) return null;
                    return (
                      <div key={idx} className="my-5 overflow-x-auto rounded-xl border border-sphera-border bg-sphera-surface/50 shadow-md">
                        <table className="w-full text-left divide-y divide-sphera-border">
                          <thead className="bg-sphera-surface-2 text-xs font-bold uppercase text-sphera-text-muted">
                            <tr>
                              {block.tableRows[0].map((cell, cIdx) => (
                                <th key={cIdx} className="px-4 py-3 text-white/95">
                                  {renderHighlightedText(cell)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sphera-border/50 text-xs sm:text-sm">
                            {block.tableRows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-4 py-2.5 text-white/85">
                                    {renderHighlightedText(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'quote':
                    return (
                      <blockquote key={idx} className="my-4 pl-4 py-1 border-l-4 border-sphera-green/60 text-white/80 italic bg-sphera-surface/30 rounded-r-lg">
                        {renderHighlightedText(block.content)}
                      </blockquote>
                    );

                  case 'code':
                    return (
                      <div key={idx} className="my-4 rounded-xl overflow-hidden border border-sphera-border bg-[#0d0d12]">
                        <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          <code>{block.content}</code>
                        </pre>
                      </div>
                    );

                  case 'formula':
                    return (
                      <div key={idx} className="my-4 p-4 rounded-xl bg-sphera-surface border border-sphera-border text-center overflow-x-auto font-mono text-sm sm:text-base text-emerald-300">
                        {renderHighlightedText(block.content)}
                      </div>
                    );

                  case 'paragraph':
                  default:
                    return (
                      <p key={idx} className="leading-relaxed text-white/85 my-2.5">
                        {renderHighlightedText(block.content)}
                      </p>
                    );
                }
              })}
            </div>
          </article>
        ) : (
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full flex-1 bg-transparent text-white text-sm focus:outline-none leading-relaxed resize-none font-mono p-4 custom-scrollbar rounded-xl border border-sphera-border/50 bg-sphera-surface/30"
              placeholder="Écrivez ou modifiez votre cours ici..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
