export interface DetectedChapter {
  id: string
  numero: number
  titre: string
  resume: string
}

/**
 * Fast client-side chapter & heading detector (0ms, 0 quota cost).
 * Scans markdown and plain-text course documents for structural headings.
 */
export function detectChaptersFromText(text: string): DetectedChapter[] {
  if (!text || text.trim().length < 60) return []

  const lines = text.split(/\r?\n/)
  const chapters: DetectedChapter[] = []
  let chapterIndex = 1

  // Regex patterns to detect headings
  const chapterRegex = /^(?:#{1,3}\s+|(?:\*{1,2})?(?:chapitre|chapter|partie|section|module|thème|theme|leçon|cours)\s+(\d+|[IVXLCDM]+)[\s:.\-\)]+)(.+)$/i
  const standaloneHeadingRegex = /^#{1,3}\s+([^#\n]+)$/
  const boldHeadingRegex = /^\*\*(?:chapitre|partie|section|module)?\s*([^*]+)\*\*$/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    let title = ''
    const match = line.match(chapterRegex)

    if (match) {
      title = match[2]?.trim() || line
    } else {
      const headingMatch = line.match(standaloneHeadingRegex)
      if (headingMatch && headingMatch[1].length >= 3 && headingMatch[1].length < 90) {
        title = headingMatch[1].trim()
      } else {
        const boldMatch = line.match(boldHeadingRegex)
        if (boldMatch && boldMatch[1].length >= 4 && boldMatch[1].length < 80) {
          title = boldMatch[1].trim()
        }
      }
    }

    // Clean title
    title = title
      .replace(/^[\dIVXLCDM\s:.\-\)]+/, '')
      .replace(/^[*\s:.-]+|[*\s:.-]+$/g, '')
      .trim()

    if (title && title.length >= 3 && title.length <= 100) {
      // Gather snippet following this heading as initial summary
      let snippet = ''
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j].trim()
        if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('**')) {
          snippet += (snippet ? ' ' : '') + nextLine
          if (snippet.length > 250) break
        }
      }

      // Avoid duplicates
      const isDuplicate = chapters.some(c => c.titre.toLowerCase() === title.toLowerCase())
      if (!isDuplicate) {
        chapters.push({
          id: `chap-${chapterIndex}`,
          numero: chapterIndex,
          titre: title,
          resume: snippet || title,
        })
        chapterIndex++
      }
    }

    if (chapters.length >= 15) break
  }

  return chapters
}
