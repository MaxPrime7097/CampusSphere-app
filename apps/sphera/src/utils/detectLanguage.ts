/**
 * Fast client-side language detector to adapt command templates and selection prompts
 * based on whether a course or selected passage is in English or French.
 */
export function isTextEnglish(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const sample = text.slice(0, 3000).toLowerCase();
  const frAccents = (sample.match(/[éèêëàâäôöûüçîïœæ]/g) || []).length;
  const frWords = (
    sample.match(/\b(le|la|les|un|une|des|du|de|pour|dans|avec|sur|qui|que|qu'|est|sont|ce|cette|ces|mais|cours|chapitre|exercice)\b/g) || []
  ).length;
  const enWords = (
    sample.match(/\b(the|this|that|these|those|and|is|are|was|were|in|on|at|for|with|from|by|to|of|an|chapter|course|exercise|what|how|why)\b/g) || []
  ).length;

  return enWords > frWords && frAccents < 3;
}
