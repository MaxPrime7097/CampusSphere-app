import { useState } from 'react'
import jsPDF from 'jspdf'

// ── Couleurs Premium (Orange Sphera V2 / CampusSphere) ─────────
const C = {
  brand:    [255, 152, 0]   as [number,number,number], // #ff9800
  brandBg:  [255, 248, 235] as [number,number,number], // Orange très clair
  brandBd:  [254, 215, 170] as [number,number,number], // Orange bordure
  dark:     [13,  14,  27]   as [number,number,number], // Midnight Black #0d0e1b
  text:     [63,  63,  70]   as [number,number,number], // Zinc-700
  muted:    [113, 113, 122] as [number,number,number], // Zinc-500
  border:   [244, 244, 245] as [number,number,number], // Zinc-100 (ultra-doux)
  cardBg:   [250, 250, 250] as [number,number,number], // Gris neutre très doux
  yellowBg: [254, 243, 199] as [number,number,number], // Amber-100
  yellowBd: [252, 211, 77]  as [number,number,number], // Amber-300
  white:    [255, 255, 255] as [number,number,number],
}

// Marges A4 à 18mm
const W = 210, H = 297, M = 18, CW = W - M * 2

// ── Nettoyage des symboles mathématiques/grecs pour Helvetica WinAnsi ──
function cleanMathSymbols(text: string): string {
  if (!text || typeof text !== 'string') return text || ''
  
  return text
    // Remplacement des lettres grecques par leur nom pour éviter la corruption de police
    .replace(/[\u0391-\u03C9]/g, (match) => {
      const greek: { [key: string]: string } = {
        'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon',
        'ζ': 'zeta', 'η': 'eta', 'θ': 'theta', 'ι': 'iota', 'κ': 'kappa',
        'λ': 'lambda', 'μ': 'mu', 'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron',
        'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'υ': 'upsilon',
        'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
        'Σ': 'Sigma', 'Δ': 'Delta', 'Γ': 'Gamma', 'Φ': 'Phi', 'Ω': 'Omega', 'Λ': 'Lambda'
      }
      return greek[match] || match
    })
    // Symboles mathématiques et logiques corrompus observés
    .replace(/£/g, 'Sigma')
    .replace(/µ/g, 'epsilon')
    .replace(/†/g, 'subset')
    .replace(/⊆/g, 'subset')
    .replace(/⊂/g, 'subset')
    .replace(/∈/g, 'in')
    .replace(/∉/g, 'not_in')
    .replace(/∅/g, 'empty_set')
    .replace(/∞/g, 'infinity')
    .replace(/≠/g, '!=')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/→/g, '->')
    .replace(/⇒/g, '=>')
    .replace(/↔/g, '<->')
    .replace(/⇔/g, '<=>')
    .replace(/∀/g, 'forall')
    .replace(/∃/g, 'exists')
    .replace(/∩/g, 'intersection')
    .replace(/∪/g, 'union')
    .replace(/×/g, '*')
    .replace(/±/g, '+/-')
}

// ── Simulateur de calcul de hauteur précis pour l'empilement sans overlap ──
function calculateTextHeight(pdf: jsPDF, content: string, width: number, size: number): number {
  if (!content) return 0
  pdf.setFontSize(size)
  const paragraphs = content.split('\n')
  let height = 0
  paragraphs.forEach((p, pIdx) => {
    if (!p.trim()) {
      height += 2.5
      return
    }
    let processedP = p
    let hasBullet = false
    if (/^\s*[-*+]\s+/.test(processedP)) {
      hasBullet = true
      processedP = processedP.replace(/^\s*[-*+]\s+/, '')
    }
    const lines = pdf.splitTextToSize(processedP, width - (hasBullet ? 6 : 0))
    height += lines.length * 5.2
    if (pIdx < paragraphs.length - 1) {
      height += 2
    }
  })
  return height
}

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

  // ── En-tête Midnight Black Premium avec bande orange ──
  header(courseName: string, label: string, logoData: string) {
    // Fond Midnight Black #0d0e1b
    this.pdf.setFillColor(13, 14, 27)
    this.pdf.rect(0, 0, W, 22, 'F')

    // Ligne d'accent Orange CampusSphere sous le bandeau sombre
    this.pdf.setFillColor(...C.brand)
    this.pdf.rect(0, 22, W, 1.2, 'F')

    // Logo image
    if (logoData) {
      this.pdf.addImage(logoData, 'PNG', M, 7, 8, 8)
    }

    // Titre Sphera en Blanc
    this.pdf.setTextColor(...C.white)
    this.pdf.setFontSize(11.5)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Sphera', M + 10.5, 12.5)

    // Date à droite
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(new Date().toLocaleDateString('fr-FR'), W - M, 12, { align: 'right' })

    this.y = 34

    // Nom du cours / Titre
    this.pdf.setTextColor(...C.dark)
    this.pdf.setFontSize(15.5)
    this.pdf.setFont('helvetica', 'bold')
    const cleanedTitle = cleanMathSymbols(courseName || 'Document')
    const lines = this.pdf.splitTextToSize(cleanedTitle, CW)
    this.pdf.text(lines, M, this.y)
    this.y += lines.length * 6.5

    // Badge de type de contenu
    this.pdf.setFillColor(...C.brandBg)
    this.pdf.setDrawColor(...C.brandBd)
    this.pdf.setLineWidth(0.25)
    this.pdf.roundedRect(M, this.y, 42, 6, 1.2, 1.2, 'FD')
    this.pdf.setTextColor(...C.brand)
    this.pdf.setFontSize(7)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(label.toUpperCase(), M + 3, this.y + 4.2)
    this.y += 10

    this.divider()
  }

  divider() {
    this.pdf.setDrawColor(...C.border)
    this.pdf.setLineWidth(0.25)
    this.pdf.line(M, this.y, W - M, this.y)
    this.y += 6
  }

  // ── Titre de section dynamique ──
  sectionTitle(text: string, color: [number,number,number] = C.brand) {
    this.guard(14)
    this.pdf.setFillColor(...color)
    this.pdf.rect(M, this.y, 3, 5.5, 'F')
    this.pdf.setTextColor(...color)
    this.pdf.setFontSize(9.5)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(text.toUpperCase(), M + 6, this.y + 4.2)
    this.y += 10
  }

  // ── Rendu d'un Tableau Markdown Vectoriel Premium ──
  drawTable(tableLines: string[]) {
    if (!tableLines || tableLines.length === 0) return

    // 1. Extraire les colonnes de l'en-tête
    const rawHeaders = tableLines[0].split('|').map(c => c.trim()).filter(c => c !== '')
    const colCount = rawHeaders.length
    if (colCount === 0) return

    const colW = CW / colCount

    // Extraire les données (sauter le séparateur |---|)
    const rows: string[][] = []
    for (let i = 1; i < tableLines.length; i++) {
      const line = tableLines[i]
      if (line.replace(/[-|:\s]/g, '').length === 0) continue // Ligne de séparation
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => !(c === '' && (idx === 0 || idx === arr.length - 1)))
      if (cells.length > 0) {
        while (cells.length < colCount) cells.push('')
        rows.push(cells.slice(0, colCount))
      }
    }

    // 2. Dessiner l'en-tête de la table
    this.guard(12)
    const headerH = 8
    const startY = this.y
    
    this.pdf.setFillColor(13, 14, 27) // Midnight black #0d0e1b
    this.pdf.rect(M, startY, CW, headerH, 'F')
    
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'bold')
    
    rawHeaders.forEach((h, colIdx) => {
      const x = M + colIdx * colW + 3
      this.pdf.text(h, x, startY + 5.2)
    })
    
    this.y = startY + headerH

    // 3. Dessiner les lignes du tableau
    rows.forEach((row, rowIdx) => {
      // Calculer la hauteur requise en wrapant le texte
      let maxLines = 1
      const cellLines = row.map(cell => {
        const lines = this.pdf.splitTextToSize(cell, colW - 6)
        if (lines.length > maxLines) maxLines = lines.length
        return lines
      })

      const rowH = maxLines * 4.8 + 4
      this.guard(rowH)

      const lineY = this.y

      // Fond alterné zébré
      this.pdf.setFillColor(...(rowIdx % 2 === 0 ? C.white : C.cardBg))
      this.pdf.rect(M, lineY, CW, rowH, 'F')

      // Ligne de bordure inférieure douce
      this.pdf.setDrawColor(...C.border)
      this.pdf.setLineWidth(0.2)
      this.pdf.line(M, lineY + rowH, W - M, lineY + rowH)

      // Texte de cellule
      this.pdf.setTextColor(...C.text)
      this.pdf.setFontSize(8)
      this.pdf.setFont('helvetica', 'normal')

      cellLines.forEach((lines, colIdx) => {
        const x = M + colIdx * colW + 3
        let textY = lineY + 4.2
        lines.forEach((lineText: string) => {
          this.pdf.text(lineText, x, textY)
          textY += 4.8
        })
      })

      this.y += rowH
    })

    this.y += 3
  }

  // ── Moteur d'indirection Rich-Text avec gras, puces et tableaux markdown ──
  text(content: string, indent = 0, opts: { bold?: boolean; size?: number; color?: [number,number,number]; noGuard?: boolean } = {}) {
    const { bold = false, size = 9.5, color = C.text, noGuard = false } = opts
    this.pdf.setTextColor(...color)
    this.pdf.setFontSize(size)

    let cleanText = cleanMathSymbols(String(content || ''))
      .replace(/^#+\s+/gm, '') // Supprime les titres Markdown
      .replace(/\*([^*]+)\*/g, '$1') // Enlève l'italique simple

    const paragraphs = cleanText.split('\n')
    let isBoldState = bold

    let pIdx = 0
    while (pIdx < paragraphs.length) {
      const p = paragraphs[pIdx]
      
      // Détection et traitement des tableaux Markdown en ligne
      if (p.trim().startsWith('|') && p.includes('|')) {
        const tableLines = []
        while (pIdx < paragraphs.length && paragraphs[pIdx].trim().startsWith('|')) {
          tableLines.push(paragraphs[pIdx].trim())
          pIdx++
        }
        this.drawTable(tableLines)
        continue
      }

      if (!p.trim()) {
        this.y += 2.5
        pIdx++
        continue
      }

      // Gestion des puces Markdown
      let hasBullet = false
      let processedP = p
      if (/^\s*[-*+]\s+/.test(processedP)) {
        hasBullet = true
        processedP = processedP.replace(/^\s*[-*+]\s+/, '')
      }

      const lines = this.pdf.splitTextToSize(processedP, CW - indent - (hasBullet ? 6 : 0))
      
      if (!noGuard) {
        this.guard(lines.length * 5.2 + 2)
      }

      lines.forEach((line: string) => {
        let xOffset = M + indent
        
        if (hasBullet && line === lines[0]) {
          this.pdf.setFillColor(...C.brand)
          this.pdf.circle(xOffset + 2, this.y - 1.5, 1, 'F')
          xOffset += 6
        } else if (hasBullet) {
          xOffset += 6
        }

        const parts = line.split('**')
        
        parts.forEach((part, partIdx) => {
          const activeBold = partIdx % 2 === 0 ? isBoldState : !isBoldState
          
          this.pdf.setFont('helvetica', activeBold ? 'bold' : 'normal')
          this.pdf.setTextColor(...(activeBold ? C.dark : color))
          
          this.pdf.text(part, xOffset, this.y)
          xOffset += this.pdf.getTextWidth(part)
        })

        if (parts.length > 1 && parts.length % 2 === 0) {
          isBoldState = !isBoldState
        }

        this.y += 5.2
      })

      if (pIdx < paragraphs.length - 1) {
        this.y += 2
      }
      pIdx++
    }
  }

  // ── Puces de listes enrichies ──
  bullet(content: string, n?: number, color: [number,number,number] = C.brand) {
    this.guard(9)
    const bx = M + 4
    if (n !== undefined) {
      this.pdf.setFillColor(...color)
      this.pdf.circle(bx, this.y - 1.5, 3, 'F')
      this.pdf.setTextColor(...C.white)
      this.pdf.setFontSize(7.5)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(String(n), bx, this.y + 0.5, { align: 'center' })
    } else {
      this.pdf.setFillColor(...C.muted)
      this.pdf.circle(bx, this.y - 1.8, 1, 'F')
    }

    this.text(content, 11, { bold: false, size: 9.5, color: C.text })
  }

  // ── Carte Définition colorée avec calcul de hauteur exact ──
  defCard(terme: string, definition: string, color: [number,number,number] = C.brand) {
    const cleanTerme = cleanMathSymbols(terme || '')
    const cleanDef = cleanMathSymbols(definition || '')
    
    // Calcul exact de la hauteur
    const tH = calculateTextHeight(this.pdf, cleanTerme, CW - 12, 9.5)
    const dH = calculateTextHeight(this.pdf, cleanDef, CW - 12, 8.5)
    const h = 4 + tH + 2 + dH + 4 // Top margin + Terme + Spacer + Def + Bottom margin
    
    const isTooLarge = h > (H - 36)
    if (!isTooLarge) {
      this.guard(h + 4)
    } else {
      this.guard(12)
    }

    const startY = this.y
    
    if (!isTooLarge) {
      this.pdf.setFillColor(...C.cardBg)
      this.pdf.setDrawColor(...C.border)
      this.pdf.setLineWidth(0.2)
      this.pdf.roundedRect(M, startY, CW, h, 2, 2, 'FD')
      this.pdf.setFillColor(...color)
      this.pdf.rect(M, startY, 2, h, 'F')
    }

    this.y = startY + 4
    this.text(cleanTerme, 6, { bold: true, size: 9.5, color: C.dark, noGuard: !isTooLarge })
    
    this.y = startY + 4 + tH + 2
    this.text(cleanDef, 6, { bold: false, size: 8.5, color: C.muted, noGuard: !isTooLarge })
    
    this.y = startY + h + 2.5
  }

  // ── Bloc Formule Conceptuelle colorée ──
  formula(content: string, color: [number,number,number] = C.brand) {
    const cleanContent = cleanMathSymbols(content || '')
    const fH = calculateTextHeight(this.pdf, cleanContent, CW - 10, 9)
    const h = 4 + fH + 4
    
    const isTooLarge = h > (H - 36)
    if (!isTooLarge) {
      this.guard(h + 3)
    } else {
      this.guard(12)
    }

    const startY = this.y
    
    if (!isTooLarge) {
      const isPink = color[0] === 236 && color[1] === 72
      const bg = isPink ? [253, 242, 248] as [number,number,number] : C.brandBg
      const bd = isPink ? [252, 231, 243] as [number,number,number] : C.brandBd

      this.pdf.setFillColor(...bg)
      this.pdf.setDrawColor(...bd)
      this.pdf.setLineWidth(0.3)
      this.pdf.roundedRect(M, startY, CW, h, 2, 2, 'FD')
    }

    this.y = startY + 4
    this.text(cleanContent, 5, { bold: true, size: 9, color: color, noGuard: !isTooLarge })
    
    this.y = startY + h + 2.5
  }

  // ── Bloc À Retenir ──
  tip(content: string, color: [number,number,number] = [234, 179, 8]) {
    const cleanContent = cleanMathSymbols(content || '')
    const tH = calculateTextHeight(this.pdf, cleanContent, CW - 14, 9)
    const h = 4 + tH + 4
    
    const isTooLarge = h > (H - 36)
    if (!isTooLarge) {
      this.guard(h + 3)
    } else {
      this.guard(12)
    }

    const startY = this.y
    
    if (!isTooLarge) {
      this.pdf.setFillColor(...C.yellowBg)
      this.pdf.setDrawColor(...C.yellowBd)
      this.pdf.setLineWidth(0.3)
      this.pdf.roundedRect(M, startY, CW, h, 2, 2, 'FD')
      
      this.pdf.setFillColor(245, 158, 11)
      this.pdf.circle(M + 5.5, startY + h / 2, 2.5, 'F')
      this.pdf.setTextColor(...C.white)
      this.pdf.setFontSize(7.5)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('!', M + 5.5, startY + h / 2 + 1, { align: 'center' })
    }

    this.y = startY + 4
    this.text(cleanContent, 11, { bold: false, size: 9, color: [120, 53, 4], noGuard: !isTooLarge })
    
    this.y = startY + h + 2.5
  }

  // ── Rendu d'un bloc adaptatif (Réponse, Code, Démonstration...) ──
  drawAdaptiveBlock(title: string, content: string, color: [number,number,number], type: 'code' | 'preuve' | 'standard' | 'explication' | 'cours' | 'retenir', flat = false) {
    const isCode = type === 'code'
    const isPreuve = type === 'preuve'
    const isStandard = type === 'standard'
    const isExplication = type === 'explication'
    const isCours = type === 'cours'
    const isRetenir = type === 'retenir'

    const cleanContent = cleanMathSymbols(content || '')
    const lines = this.pdf.splitTextToSize(cleanContent, CW - (isCode ? 16 : 14))
    
    // Calcul exact de la hauteur de texte de l'encadré
    let textH = 0
    if (isCode) {
      textH = lines.length * 4.8
    } else {
      textH = calculateTextHeight(this.pdf, cleanContent, CW - 17, 8.5)
    }

    const h = 6 + textH + 4 // Top header + text height + bottom padding

    if (!flat) {
      const startY = this.y
      let bg: [number,number,number] = C.cardBg
      let bd: [number,number,number] = C.border
      let accent: [number,number,number] = color

      if (isCode) {
        bg = [23, 23, 23]
        bd = [63, 63, 70]
      } else if (isPreuve) {
        bg = [239, 246, 255]
        bd = [191, 219, 254]
      } else if (isStandard) {
        bg = [240, 253, 250]
        bd = [153, 246, 228]
        accent = [13, 148, 136]
      } else if (isExplication) {
        bg = [239, 246, 255]
        bd = [191, 219, 254]
      } else if (isCours) {
        bg = [250, 245, 255]
        bd = [233, 213, 255]
      } else if (isRetenir) {
        bg = [255, 248, 235]
        bd = [254, 215, 170]
      }

      this.pdf.setFillColor(...bg)
      this.pdf.setDrawColor(...bd)
      this.pdf.setLineWidth(0.25)
      this.pdf.roundedRect(M + 6, startY, CW - 6, h, 1.5, 1.5, 'FD')

      if (!isCode) {
        this.pdf.setFillColor(...accent)
        this.pdf.rect(M + 6, startY, 1.8, h, 'F')
      } else {
        this.pdf.setFillColor(39, 39, 42)
        this.pdf.rect(M + 6, startY, CW - 6, 6, 'F')
        this.pdf.setDrawColor(...bd)
        this.pdf.line(M + 6, startY + 6, W - M, startY + 6)
      }

      this.pdf.setTextColor(...accent)
      this.pdf.setFontSize(7.5)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(title.toUpperCase(), M + 11, startY + 4.2)

      this.y = startY + (isCode ? 9.5 : 9)
      
      if (isCode) {
        this.pdf.setFont('courier', 'normal')
        this.pdf.setTextColor(228, 228, 231)
        this.pdf.setFontSize(8.5)
        lines.forEach((lineText: string) => {
          this.pdf.text(lineText, M + 12, this.y)
          this.y += 4.8
        })
      } else {
        this.text(cleanContent, 11, { bold: false, size: 8.5, color: isPreuve ? [17, 24, 39] : C.text, noGuard: true })
      }
      
      // Positionnement exact du pointeur après la boîte + espacement de sécurité
      this.y = startY + h + 3
    } else {
      // Version flat avec sauts de page fluides autorisés
      this.guard(14)
      
      this.pdf.setFillColor(...color)
      this.pdf.rect(M + 6, this.y, 2, 4.5, 'F')
      this.pdf.setTextColor(...color)
      this.pdf.setFontSize(8)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(title.toUpperCase(), M + 11, this.y + 3.2)
      this.y += 6

      if (isCode) {
        this.pdf.setFont('courier', 'normal')
        this.pdf.setTextColor(63, 63, 70)
        this.pdf.setFontSize(8.5)
        lines.forEach((lineText: string) => {
          this.guard(6)
          this.pdf.text(lineText, M + 12, this.y)
          this.y += 4.8
        })
      } else {
        this.text(cleanContent, 11, { bold: false, size: 8.5, color: C.text, noGuard: false })
      }
      this.y += 2
    }
  }

  // ── Bloc Correction de Question (Annale) ──
  questionBlock(q: any, mode?: string) {
    const type = q.type || 'ouvert'
    const enonce = cleanMathSymbols(q.enonce || q.question || '')
    const reponse = cleanMathSymbols(q.reponse || '')
    const explication = cleanMathSymbols(q.explication || '')
    const chapitre = cleanMathSymbols(q.source_cours || q.chapitre || '')
    const a_retenir = cleanMathSymbols(q.a_retenir || '')
    const num = q.numero || '?'

    // 1. Calcul exact et rigoureux des hauteurs de chaque partie
    const eTextH = calculateTextHeight(this.pdf, enonce, CW - 16, 9.5)
    let totalH = eTextH + 8

    // Réponse
    const isCode = type === 'code'
    let rH = 0
    if (isCode) {
      const rLines = this.pdf.splitTextToSize(reponse, CW - 16)
      rH = 6 + (rLines.length * 4.8) + 8
    } else {
      const rTextH = calculateTextHeight(this.pdf, reponse, CW - 17, 8.5)
      rH = 6 + rTextH + 4
    }
    totalH += rH + 3

    // Explication (si mode complet)
    let xH = 0
    if (explication && mode !== 'rapide') {
      const xTextH = calculateTextHeight(this.pdf, explication, CW - 17, 8.5)
      xH = 6 + xTextH + 4
      totalH += xH + 3
    }

    // Référence cours / Chapitre
    let cH = 0
    if (chapitre) {
      const cTextH = calculateTextHeight(this.pdf, chapitre, CW - 17, 8.5)
      cH = 6 + cTextH + 4
      totalH += cH + 3
    }

    // À Retenir
    let aH = 0
    if (a_retenir) {
      const aTextH = calculateTextHeight(this.pdf, a_retenir, CW - 17, 8.5)
      aH = 6 + aTextH + 4
      totalH += aH + 3
    }

    totalH += 4 // Marge finale de confort

    // Mode Flat adaptatif si l'ensemble dépasse la taille d'une page
    const isTooLarge = totalH > (H - 36)
    
    if (!isTooLarge) {
      this.guard(totalH)
    } else {
      this.guard(15) // Garde minimale pour démarrer la question proprement
    }

    const startY = this.y

    // Numéro bulle en Orange léger
    this.pdf.setFillColor(255, 248, 235)
    this.pdf.setDrawColor(254, 215, 170)
    this.pdf.setLineWidth(0.25)
    this.pdf.circle(M + 4, startY + 4, 3, 'FD')
    this.pdf.setTextColor(255, 152, 0)
    this.pdf.setFontSize(7.5)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(String(num), M + 4, startY + 5.2, { align: 'center' })

    // Question énoncé
    this.y = startY + 5
    this.text(enonce, 11, { bold: true, size: 9.5, color: C.dark, noGuard: isTooLarge ? false : true })
    this.y += 3

    // Réponse
    if (type === 'code') {
      this.drawAdaptiveBlock('Code', reponse, [168, 85, 247], 'code', isTooLarge)
    } else if (type === 'preuve') {
      this.drawAdaptiveBlock('Démonstration', reponse, [59, 130, 246], 'preuve', isTooLarge)
    } else {
      this.drawAdaptiveBlock('Réponse', reponse, [16, 185, 129], 'standard', isTooLarge)
    }

    // Explication (mode complet)
    if (explication && mode !== 'rapide') {
      this.drawAdaptiveBlock('Explication', explication, [59, 130, 246], 'explication', isTooLarge)
    }

    // Référence Cours
    if (chapitre) {
      this.drawAdaptiveBlock('Référence cours', chapitre, [168, 85, 247], 'cours', isTooLarge)
    }

    // À Retenir
    if (a_retenir) {
      this.drawAdaptiveBlock('À retenir', a_retenir, [255, 152, 0], 'retenir', isTooLarge)
    }

    this.y += 2
  }

  // ── Footer finalisé ──
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
    b.sectionTitle('Résumé', [59, 130, 246]) // Bleu
    b.text(f.resume, 0, { color: C.text })
    b.y += 3
  }

  if (f.points_cles?.length) {
    b.sectionTitle('Points clés', [34, 197, 94]) // Vert
    f.points_cles.forEach((p: string, i: number) => b.bullet(p, i + 1, [34, 197, 94]))
    b.y += 2
  }

  if (f.definitions?.length) {
    b.sectionTitle('Définitions', [168, 85, 247]) // Purple / Violet
    f.definitions.forEach((d: any) => b.defCard(d.terme || d.word || '', d.definition || d.meaning || '', [168, 85, 247]))
    b.y += 2
  }

  if (f.formules?.length) {
    b.sectionTitle('Formules & Concepts', [236, 72, 153]) // Rose / Pink
    f.formules.forEach((fm: string) => b.formula(fm, [236, 72, 153]))
    b.y += 2
  }

  if (f.a_retenir?.length) {
    b.sectionTitle('À retenir', [234, 179, 8]) // Jaune
    f.a_retenir.forEach((t: string) => b.tip(t, [234, 179, 8]))
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
    generateFiche: (content: any, name?: string) => download((logo) => { generateFichePDF(content, name, logo) }), 
    generateAnnale: (annale: any, name?: string) => download((logo) => { generateAnnalePDF(annale, name, logo) }) 
  }
}

export const buildPDFFilename = (prefix: string, sourceName: string): string => {
  const date = new Date().toISOString().split('T')[0]
  const clean = (sourceName || 'document').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40)
  return `Sphera_${prefix}_${clean}_${date}`
}
