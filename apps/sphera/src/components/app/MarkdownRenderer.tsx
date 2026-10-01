import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

function splitTableRow(rowStr: string): string[] {
  let s = rowStr.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map(c => c.trim())
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('-')) return false
  const cells = splitTableRow(trimmed)
  if (cells.length === 0) return false
  return cells.every(c => /^:?-{2,}:?$/.test(c.trim()))
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockLines: string[] = []

  let listType: 'ul' | 'ol' | null = null
  let listItems: string[] = []

  const flushList = (keyPrefix: string) => {
    if (listItems.length > 0 && listType) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`${keyPrefix}-ul`} className="my-2.5 space-y-1 pl-5 list-disc marker:text-sphera-green text-sm text-white/90">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`${keyPrefix}-ol`} className="my-2.5 space-y-1 pl-5 list-decimal marker:text-sphera-green font-medium text-sm text-white/90">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed font-normal">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        )
      }
      listItems = []
      listType = null
    }
  }

  const renderInline = (text: string): React.ReactNode[] => {
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
    const parts = text.split(regex)

    return parts.map((part, i) => {
      if (!part) return null

      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-sphera-surface border border-sphera-border text-sphera-green font-mono text-xs mx-0.5"
          >
            {part.slice(1, -1)}
          </code>
        )
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }

      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-white/90">
            {part.slice(1, -1)}
          </em>
        )
      }

      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sphera-green hover:underline"
          >
            {linkMatch[1]}
          </a>
        )
      }

      return <React.Fragment key={i}>{part}</React.Fragment>
    })
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    const trimmed = line.trim()

    // Code block start/end
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeBlockLines.join('\n')
        elements.push(
          <CodeBlockItem key={`code-${idx}`} code={codeText} lang={codeBlockLang} />
        )
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLang = ''
        continue
      } else {
        // Start code block
        flushList(`code-start-${idx}`)
        inCodeBlock = true
        codeBlockLang = trimmed.slice(3).trim()
        codeBlockLines = []
        continue
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // Markdown Table Detection
    if (trimmed.includes('|') && idx + 1 < lines.length && isTableSeparator(lines[idx + 1])) {
      flushList(`table-start-${idx}`)
      const headers = splitTableRow(trimmed)
      const sepCells = splitTableRow(lines[idx + 1])
      const alignments: ('left' | 'center' | 'right')[] = sepCells.map(c => {
        const t = c.trim()
        if (t.startsWith(':') && t.endsWith(':')) return 'center'
        if (t.endsWith(':')) return 'right'
        return 'left'
      })

      const tableRows: string[][] = []
      let rowIdx = idx + 2
      while (rowIdx < lines.length) {
        const candidate = lines[rowIdx].trim()
        if (!candidate.includes('|') || candidate === '') break
        tableRows.push(splitTableRow(candidate))
        rowIdx++
      }

      elements.push(
        <div
          key={`table-${idx}`}
          className="my-3.5 w-full overflow-x-auto rounded-xl border border-sphera-border bg-sphera-surface-2/60 shadow-sm"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-sphera-surface border-b border-sphera-border text-white">
              <tr>
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className="px-4 py-2.5 whitespace-nowrap font-semibold text-white tracking-wide border-r border-sphera-border/30 last:border-r-0"
                    style={{ textAlign: alignments[hIdx] || 'left' }}
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sphera-border/30 text-white/90">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-sphera-surface/50 transition-colors">
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-4 py-2 leading-relaxed border-r border-sphera-border/20 last:border-r-0"
                      style={{ textAlign: alignments[cIdx] || 'left' }}
                    >
                      {renderInline(row[cIdx] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

      idx = rowIdx - 1
      continue
    }

    // Bullet list item (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') {
        flushList(`switch-to-ul-${idx}`)
        listType = 'ul'
      }
      listItems.push(trimmed.replace(/^[-*]\s+/, ''))
      continue
    }


    // Numbered list item (1. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numberedMatch) {
      if (listType !== 'ol') {
        flushList(`switch-to-ol-${idx}`)
        listType = 'ol'
      }
      listItems.push(numberedMatch[2])
      continue
    }

    // If not a list item, flush any pending list
    flushList(`line-${idx}`)

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-xl font-bold font-display text-white mt-4 mb-2 pb-1.5 border-b border-sphera-border/60">
          {renderInline(trimmed.slice(2))}
        </h1>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-base sm:text-lg font-bold font-display text-sphera-green mt-3.5 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-sm sm:text-base font-semibold text-white mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      )
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={idx} className="my-2.5 pl-3.5 border-l-2 border-sphera-green/60 text-white/80 italic text-sm bg-sphera-surface/40 py-1 rounded-r-lg">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      )
    } else if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={idx} className="my-3 border-sphera-border/60" />)
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1.5" />)
    } else {
      elements.push(
        <p key={idx} className="text-sm leading-relaxed text-white/90 my-1">
          {renderInline(line)}
        </p>
      )
    }
  }

  // Flush any remaining list or code block
  flushList('final')
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <CodeBlockItem key="code-final" code={codeBlockLines.join('\n')} lang={codeBlockLang} />
    )
  }

  return <div className={`space-y-1 leading-relaxed ${className}`}>{elements}</div>
}

function CodeBlockItem({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-sphera-border bg-[#141414] font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-sphera-surface/70 border-b border-sphera-border/50 text-sphera-text-muted">
        <span className="text-[11px] uppercase tracking-wider">{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-sphera-green" />
              <span className="text-sphera-green">Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-white/90 font-mono text-xs leading-relaxed custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  )
}
