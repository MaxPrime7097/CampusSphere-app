import { useState } from 'react'
import jsPDF from 'jspdf'

// ── Couleurs ──────────────────────────────────────────────
const C = {
  green:    [34, 197, 94]   as [number,number,number],
  greenBg:  [240, 253, 244] as [number,number,number],
  greenBd:  [187, 247, 208] as [number,number,number],
  dark:     [18,  18,  18]  as [number,number,number],
  text:     [30,  30,  30]  as [number,number,number],
  muted:    [100, 100, 100] as [number,number,number],
  border:   [220, 220, 220] as [number,number,number],
  cardBg:   [249, 250, 251] as [number,number,number],
  yellowBg: [255, 251, 235] as [number,number,number],
  yellowBd: [253, 224, 100] as [number,number,number],
  white:    [255, 255, 255] as [number,number,number],
}

const W = 210, H = 297, M = 15, CW = W - M * 2

class PDFBuilder {
  pdf: jsPDF
  y: number

  constructor() {
    this.pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    this.y = M
  }

  newPage() {
    this.pdf.addPage()
    this.y = M + 5
  }

  guard(need = 12) {
    if (this.y + need > H - 18) this.newPage()
  }

  // ── Barre verte en haut ──
  header(courseName: string, label: string, logoData: string) {
    this.pdf.setFillColor(...C.green)
    this.pdf.rect(0, 0, W, 20, 'F')

    // Logo image
    if (logoData) {
      this.pdf.addImage(logoData, 'PNG', M, 6, 8, 8)
    }

    // Titre Sphera
    this.pdf.setTextColor(...C.white)
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Sphera', M + 10, 11.5)

    // Date à droite
    this.pdf.setFontSize(7.5)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(new Date().toLocaleDateString('fr-FR'), W - M, 11, { align: 'right' })

    this.y = 28

    // Nom du cours
    this.pdf.setTextColor(...C.dark)
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    const lines = this.pdf.splitTextToSize(courseName || 'Document', CW)
    this.pdf.text(lines, M, this.y)
    this.y += lines.length * 7

    // Badge type (Fiche / Correction)
    this.pdf.setFillColor(...C.greenBg)
    this.pdf.setDrawColor(...C.green)
    this.pdf.setLineWidth(0.3)
    this.pdf.roundedRect(M, this.y, 52, 6.5, 1.5, 1.5, 'FD')
    this.pdf.setTextColor(...C.green)
    this.pdf.setFontSize(7)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(label.toUpperCase(), M + 3, this.y + 4.5)
    this.y += 11

    this.divider()
  }

  divider() {
    this.pdf.setDrawColor(...C.border)
    this.pdf.setLineWidth(0.25)
    this.pdf.line(M, this.y, W - M, this.y)
    this.y += 6
  }

  // ── Titre de section (ex: Résumé, Points clés) ──
  sectionTitle(text: string, color: [number,number,number] = C.green) {
    this.guard(14)
    this.pdf.setFillColor(...color)
    this.pdf.rect(M, this.y, 3, 5.5, 'F')
    this.pdf.setTextColor(...color)
    this.pdf.setFontSize(8.5)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(text.toUpperCase(), M + 6, this.y + 4)
    this.y += 10
  }

  // ── Texte courant ──
  text(content: string, indent = 0, opts: { bold?: boolean; size?: number; color?: [number,number,number] } = {}) {
    const { bold = false, size = 9.5, color = C.text } = opts
    this.pdf.setTextColor(...color)
    this.pdf.setFontSize(size)
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = this.pdf.splitTextToSize(String(content || ''), CW - indent)
    this.guard(lines.length * 5.2)
    this.pdf.text(lines, M + indent, this.y)
    this.y += lines.length * 5.2 + 1.5
  }

  // ── Bullet numéroté ──
  bullet(text: string, n?: number) {
    this.guard(9)
    const bx = M + 4
    const tx = M + 11
    if (n !== undefined) {
      this.pdf.setFillColor(...C.green)
      this.pdf.circle(bx, this.y - 1.5, 3, 'F')
      this.pdf.setTextColor(...C.white)
      this.pdf.setFontSize(7)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(String(n), bx, this.y + 0.5, { align: 'center' })
    } else {
      this.pdf.setFillColor(...C.muted)
      this.pdf.circle(bx, this.y - 1.8, 1.2, 'F')
    }
    this.pdf.setTextColor(...C.text)
    this.pdf.setFontSize(9.5)
    this.pdf.setFont('helvetica', 'normal')
    const lines = this.pdf.splitTextToSize(String(text || ''), CW - 13)
    this.pdf.text(lines, tx, this.y)
    this.y += lines.length * 5 + 2.5
  }

  // ── Carte définition ──
  defCard(terme: string, definition: string) {
    const tLines = this.pdf.splitTextToSize(terme || '', CW - 10)
    const dLines = this.pdf.splitTextToSize(definition || '', CW - 10)
    const h = (tLines.length + dLines.length) * 5 + 10
    this.guard(h + 4)

    this.pdf.setFillColor(...C.cardBg)
    this.pdf.setDrawColor(...C.border)
    this.pdf.setLineWidth(0.2)
    this.pdf.roundedRect(M, this.y, CW, h, 2, 2, 'FD')
    this.pdf.setFillColor(...C.green)
    this.pdf.rect(M, this.y, 2.5, h, 'F')

    this.pdf.setTextColor(...C.dark)
    this.pdf.setFontSize(9.5)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(tLines, M + 6, this.y + 5)

    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(...C.muted)
    this.pdf.text(dLines, M + 6, this.y + 5 + tLines.length * 5)

    this.y += h + 3
  }

  // ── Bloc formule ──
  formula(text: string) {
    const lines = this.pdf.splitTextToSize(text || '', CW - 10)
    const h = lines.length * 5 + 7
    this.guard(h + 3)

    this.pdf.setFillColor(...C.greenBg)
    this.pdf.setDrawColor(...C.greenBd)
    this.pdf.setLineWidth(0.3)
    this.pdf.roundedRect(M, this.y, CW, h, 2, 2, 'FD')
    this.pdf.setTextColor(...C.green)
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(lines, M + 5, this.y + 5)
    this.y += h + 3
  }

  // ── Bloc À retenir ──
  tip(text: string) {
    const lines = this.pdf.splitTextToSize(text || '', CW - 14)
    const h = lines.length * 5 + 7
    this.guard(h + 3)

    this.pdf.setFillColor(...C.yellowBg)
    this.pdf.setDrawColor(...C.yellowBd)
    this.pdf.setLineWidth(0.3)
    this.pdf.roundedRect(M, this.y, CW, h, 2, 2, 'FD')
    this.pdf.setFillColor(251, 191, 36)
    this.pdf.circle(M + 5.5, this.y + h / 2, 2.5, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(7)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('!', M + 5.5, this.y + h / 2 + 1.5, { align: 'center' })
    this.pdf.setTextColor(92, 65, 0)
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(lines, M + 11, this.y + 5)
    this.y += h + 2.5
  }

  // ── Question annale ──
  questionBlock(q: any, mode?: string) {
    const enonce = q.enonce || q.question || ''
    const reponse = q.reponse || ''
    const explication = q.explication || ''
    const chapitre = q.source_cours || q.chapitre || ''
    const num = q.numero || '?'

    // Énoncé
    const eLines = this.pdf.splitTextToSize(String(enonce), CW - 16)
    const rLines = this.pdf.splitTextToSize(String(reponse), CW - 20)
    const xLines = explication ? this.pdf.splitTextToSize(String(explication), CW - 20) : []
    const totalH = (eLines.length + rLines.length) * 5 + (xLines.length * 4.8) + 22 + (chapitre ? 8 : 0)
    this.guard(totalH)

    const startY = this.y

    // Numéro bulle
    this.pdf.setFillColor(...C.green)
    this.pdf.circle(M + 4, startY + 4, 3.5, 'F')
    this.pdf.setTextColor(...C.white)
    this.pdf.setFontSize(7)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(String(num), M + 4, startY + 5.5, { align: 'center' })

    // Énoncé
    this.pdf.setTextColor(...C.dark)
    this.pdf.setFontSize(9.5)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(eLines, M + 11, startY + 5)
    this.y = startY + eLines.length * 5 + 7

    // Réponse
    this.pdf.setFillColor(...C.greenBg)
    this.pdf.setDrawColor(...C.greenBd)
    const rH = rLines.length * 4.8 + 7
    this.pdf.roundedRect(M + 6, this.y, CW - 6, rH, 1.5, 1.5, 'FD')
    this.pdf.setFillColor(...C.green)
    this.pdf.rect(M + 6, this.y, 2, rH, 'F')
    this.pdf.setTextColor(...C.green)
    this.pdf.setFontSize(7)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('RÉPONSE', M + 11, this.y + 3.5)
    this.pdf.setTextColor(...C.text)
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(rLines, M + 11, this.y + 7)
    this.y += rH + 2

    // Explication (mode complet)
    if (explication && mode !== 'rapide') {
      const xH = xLines.length * 4.8 + 7
      this.pdf.setFillColor(239, 246, 255)
      this.pdf.setDrawColor(191, 219, 254)
      this.pdf.roundedRect(M + 6, this.y, CW - 6, xH, 1.5, 1.5, 'FD')
      this.pdf.setFillColor(59, 130, 246)
      this.pdf.rect(M + 6, this.y, 2, xH, 'F')
      this.pdf.setTextColor(59, 130, 246)
      this.pdf.setFontSize(7)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('EXPLICATION', M + 11, this.y + 3.5)
      this.pdf.setTextColor(...C.muted)
      this.pdf.setFontSize(8.5)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(xLines, M + 11, this.y + 7)
      this.y += xH + 2
    }

    // Chapitre
    if (chapitre) {
      this.pdf.setTextColor(...C.muted)
      this.pdf.setFontSize(7.5)
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.text(`📖  ${chapitre}`, M + 11, this.y + 3)
      this.y += 7
    }

    this.y += 3
  }

  // ── Footer sur toutes les pages ──
  finalize(filename: string) {
    const total = this.pdf.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      this.pdf.setPage(i)
      const fy = H - 10
      this.pdf.setDrawColor(...C.border)
      this.pdf.setLineWidth(0.25)
      this.pdf.line(M, fy - 3, W - M, fy - 3)
      this.pdf.setTextColor(...C.muted)
      this.pdf.setFontSize(7)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text('Généré par Sphera', M, fy)
      this.pdf.text(`sphera.campussphere.app  ·  ${i}/${total}`, W - M, fy, { align: 'right' })
    }
    this.pdf.save(`${filename}.pdf`)
  }
}

// ── Générateur Fiche ──────────────────────────────────────
export function generateFichePDF(content: any, sourceName: string | undefined, logoData: string) {
  const f = content?.fiche || content || {}
  const b = new PDFBuilder()
  b.header(f.titre || sourceName || 'Fiche de révision', 'Fiche de révision', logoData)

  if (f.resume) {
    b.sectionTitle('Résumé')
    b.text(f.resume, 0, { color: C.muted })
    b.y += 3
  }

  if (f.points_cles?.length) {
    b.sectionTitle('Points clés', C.green)
    f.points_cles.forEach((p: string, i: number) => b.bullet(p, i + 1))
    b.y += 2
  }

  if (f.definitions?.length) {
    b.sectionTitle('Définitions', [147, 51, 234])
    f.definitions.forEach((d: any) => b.defCard(d.terme, d.definition))
    b.y += 2
  }

  if (f.formules?.length) {
    b.sectionTitle('Formules & Concepts', [236, 72, 153])
    f.formules.forEach((fm: string) => b.formula(fm))
    b.y += 2
  }

  if (f.a_retenir?.length) {
    b.sectionTitle('À retenir', [234, 179, 8])
    f.a_retenir.forEach((t: string) => b.tip(t))
  }

  b.divider()
  b.finalize(buildPDFFilename('Fiche', sourceName || f.titre || 'cours'))
}

// ── Générateur Annale ─────────────────────────────────────
export function generateAnnalePDF(annale: any, sourceName: string | undefined, logoData: string) {
  const { content, mode } = annale
  const b = new PDFBuilder()
  const titre = content?.titre || sourceName || "Correction d'annale"
  const modeLabel = mode === 'complete' ? 'Correction complète' : 'Correction rapide'
  b.header(titre, modeLabel, logoData)

  const isRawArray  = Array.isArray(content)
  const hasSections = !isRawArray && Array.isArray(content?.sections) && content.sections.length > 0
  const hasLegacy   = !isRawArray && Array.isArray(content?.corrections)

  if (hasSections) {
    content.sections.forEach((section: any, si: number) => {
      b.sectionTitle(`${si + 1}. ${section.nom}`, [249, 115, 22])
      ;(section.questions || []).forEach((q: any, qi: number) => {
        b.questionBlock({ ...q, numero: q.numero || qi + 1 }, mode)
      })
      if (si < content.sections.length - 1) b.divider()
    })
  } else {
    const list = isRawArray ? content : (content?.corrections || [])
    list.forEach((q: any, i: number) => b.questionBlock({ ...q, numero: q.numero || i + 1 }, mode))
  }

  if (content?.conseils_generaux?.length) {
    b.divider()
    b.sectionTitle('Conseils généraux', [249, 115, 22])
    content.conseils_generaux.forEach((c: string) => b.bullet(c))
  }

  b.divider()
  b.finalize(buildPDFFilename('Correction', sourceName || titre))
}

// ── Hook ─────────────────────────────────────────────────

const loadImage = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('Canvas context is null'))
      }
    }
    img.onerror = () => reject(new Error('Image load error'))
    img.src = url
  })
}

export const useDownloadPDF = () => {
  const [isDownloading, setIsDownloading] = useState(false)

  const download = async (generatorFn: (logoData: string) => void) => {
    setIsDownloading(true)
    try { 
      await document.fonts.ready;
      // On charge le logo (fallback vide si échec pour ne pas bloquer le PDF)
      let logoData = ''
      try {
        logoData = await loadImage('/favicon-96x96.png')
      } catch (err) {
        console.warn('[PDF] Failed to load logo image, proceeding without it.', err)
      }
      generatorFn(logoData) 
    }
    catch (e) { 
      console.error('[PDF]', e)
      alert("Impossible de générer le PDF. Réessaie.") 
    }
    finally { 
      setIsDownloading(false) 
    }
  }

  return { 
    isDownloading, 
    generateFiche: (content: any, name?: string) => download((logo) => generateFichePDF(content, name, logo)), 
    generateAnnale: (annale: any, name?: string) => download((logo) => generateAnnalePDF(annale, name, logo)) 
  }
}

export const buildPDFFilename = (prefix: string, sourceName: string): string => {
  const date = new Date().toISOString().split('T')[0]
  const clean = (sourceName || 'document').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40)
  return `Sphera_${prefix}_${clean}_${date}`
}
