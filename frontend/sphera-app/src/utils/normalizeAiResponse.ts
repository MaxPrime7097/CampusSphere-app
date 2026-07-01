export function normalizeAiResponse(text: string | null | undefined): string {
  if (!text) return ''
  let t = String(text)
  // Remove bold/strong markdown markers
  t = t.replace(/\*\*(.*?)\*\*/gs, '$1')
  t = t.replace(/__(.*?)__/gs, '$1')
  // Remove leading filler phrases commonly used by assistants (English & French common starters)
  t = t.replace(/^\s*(?:Alright|Okay|Ok|Très bien|D'accord|Bien|Bon|Super|Voici|Alors|Très bien,|D'accord,|Ok,|Alright,)[^\n]*[\n\r]*/i, '')
  // Remove "Let's ..." style intros
  t = t.replace(/^\s*(?:Let(?:'|’)s(?: break this down| start with| start by)?)[^\n]*[\n\r]*/i, '')
  // Remove French "Je vais" style intros
  t = t.replace(/^\s*(?:Je vais|Je vais commencer par|Je vais commencer)[^\n]*[\n\r]*/i, '')
  // Trim whitespace
  return t.trim()
}
