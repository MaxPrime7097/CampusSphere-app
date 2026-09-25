import { useState } from "react";
import { generateFicheHtml, generateAnnaleHtml, printHtmlDocument } from "../utils/printPdfGenerator";

export const useDownloadPDF = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateFiche = async (content: any, sourceName?: string) => {
    setIsDownloading(true);
    try {
      const f = content?.fiche || content || {};
      const titleSlug = (f.titre || sourceName || "fiche")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 35);
      const docTitle = `Sphera_Fiche_${titleSlug}`;
      const html = generateFicheHtml({ fiche: content, sourceName });
      await printHtmlDocument(html, docTitle);
    } catch (e) {
      console.error("[PDF]", e);
      alert("Erreur lors de la préparation de l'export PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const generateAnnale = async (annale: any, sourceName?: string) => {
    setIsDownloading(true);
    try {
      const titleSlug = (annale?.titre || sourceName || "annale")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 35);
      const docTitle = `Sphera_Annale_${titleSlug}`;
      const html = generateAnnaleHtml({ annale, sourceName });
      await printHtmlDocument(html, docTitle);
    } catch (e) {
      console.error("[PDF]", e);
      alert("Erreur lors de la préparation de l'export PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    generateFiche,
    generateAnnale,
  };
};
