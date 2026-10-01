# Sphera - Routing IA final par type de tache (post-tests)

## Decision finale (validee par tests reels sur vrais cours IUC)

```
Fiche de revision  -> DeepSeek V3.2 (Bedrock)
Quiz interactif    -> DeepSeek V3.2 (Bedrock)
Flashcards         -> DeepSeek V3.2 (Bedrock)
Correction annales -> Claude Haiku 4.5 (Bedrock)
Q&A conversationnel-> Claude Haiku 4.5 (Bedrock)
Suggestions Q&A    -> GPT-OSS-120B (Groq)
```

Raisonnement : Fiche/Quiz/Flashcards representent le plus gros volume
(70-80% des generations estimees) et sont des taches plus simples/
repetitives -> DeepSeek (moins cher) suffit, valide par test reel.

Annales et Q&A sont des taches plus complexes (structuration multi-
sections, raisonnement conversationnel, fidelite au cours) -> Claude
Haiku (plus fiable) reste sur ces 2 taches malgre le cout plus eleve,
car elles representent un volume plus faible et la qualite y est plus
critique.

---

## Tarifs Bedrock (region a confirmer selon disponibilite DeepSeek)

```
Claude Haiku 4.5 : 1,00$/M input  | 5,00$/M output
DeepSeek V3.2    : 0,62$/M input  | 1,85$/M output (region US ref.)
```

Note : DeepSeek V3.2 n'est pas forcement disponible dans la meme
region que Claude Haiku (Afrique/Le Cap). Verifier la disponibilite
reelle - possibilite d'utiliser une region differente pour les appels
DeepSeek specifiquement, ou cross-region inference si Bedrock le permet.

## Point d'attention JSON (deja identifie, a surveiller en prod)

Certaines sources indiquent que DeepSeek V3.2 ne supporte pas le JSON
Schema natif de facon aussi stricte que Claude. Le test manuel a valide
la fiabilite sur les prompts actuels (FICHE_PROMPT, QUIZ_PROMPT,
FLASHCARDS_PROMPT), mais garder un fallback vers Claude Haiku en cas
d'echec de parsing JSON sur ces 3 taches, pas seulement vers Gemini/Groq.

---

## Implementation backend (Node.js + Express)

### 1. Deux fonctions provider distinctes

```javascript
// services/aiProviders.js

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime")

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
})

// --- Claude Haiku 4.5 (Annales + Q&A) ---
async function generateWithClaudeHaiku(prompt) {
  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_CLAUDE_MODEL_ID, // ex: anthropic.claude-haiku-4-5-...
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }]
    })
  })
  const response = await bedrockClient.send(command)
  const body = JSON.parse(new TextDecoder().decode(response.body))
  return { text: body.content[0].text, usage: body.usage }
}

// --- DeepSeek V3.2 (Fiche/Quiz/Flashcards) ---
async function generateWithDeepSeek(prompt) {
  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_DEEPSEEK_MODEL_ID, // ex: deepseek.v3-2-v1:0
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
    })
  })
  const response = await bedrockClient.send(command)
  const body = JSON.parse(new TextDecoder().decode(response.body))
  // Adapter selon le format de reponse exact DeepSeek sur Bedrock
  // (verifier la doc - peut differer du format Anthropic)
  return { text: body.choices?.[0]?.message?.content || body.content, usage: body.usage }
}

module.exports = { generateWithClaudeHaiku, generateWithDeepSeek }
```

### 2. Router par type de tache

```javascript
// services/aiRouter.js

const { generateWithClaudeHaiku, generateWithDeepSeek } = require('./aiProviders')
const { generateWithGemini, generateWithGroq } = require('./aiProvidersFallback') // existants

// Mapping tache -> provider principal
const TASK_PRIMARY_PROVIDER = {
  fiche: 'deepseek',
  quiz: 'deepseek',
  flashcards: 'deepseek',
  annale: 'claude',
  qa: 'claude',
}

const PROVIDER_FUNCTIONS = {
  deepseek: generateWithDeepSeek,
  claude: generateWithClaudeHaiku,
}

async function generateWithFallback(text, toolType, userId) {
  const contextPrefix = userId ? buildContextPrefix(await getUserAcademicContext(userId)) : ""
  const prompt = contextPrefix + getPrompt(toolType, text)

  const primaryProviderName = TASK_PRIMARY_PROVIDER[toolType] || 'claude'
  const primaryFn = PROVIDER_FUNCTIONS[primaryProviderName]

  // Chaine de fallback : primaire de la tache -> l'autre Bedrock -> Gemini -> Groq
  const secondaryBedrockName = primaryProviderName === 'deepseek' ? 'claude' : 'deepseek'
  const secondaryFn = PROVIDER_FUNCTIONS[secondaryBedrockName]

  const chain = [
    [primaryProviderName, primaryFn],
    [secondaryBedrockName, secondaryFn],  // filet de securite si JSON casse ou erreur
    ["gemini", generateWithGemini],
    ["groq", generateWithGroq],
  ]

  let lastError = null
  for (const [name, fn] of chain) {
    try {
      const result = await fn(prompt)
      const parsed = cleanJson(result.text || result)
      logger.info(`[AI] Success: ${name} for ${toolType}`)
      await logAIUsage(name, toolType, result.usage) // pour le dashboard de suivi budget
      return parsed
    } catch (e) {
      logger.warn(`[AI] ${name} failed for ${toolType}: ${e.message}`)
      lastError = e
    }
  }
  throw new Error(`Tous les providers IA ont echoue pour ${toolType}. Derniere erreur : ${lastError}`)
}

module.exports = { generateWithFallback }
```

### 3. Tracking cout differencie par provider (mise a jour du dashboard budget)

```javascript
// models/AIUsageLog.js - ajouter deepseek comme provider possible

const AIUsageLogSchema = {
  provider: { type: String, enum: ['claude', 'deepseek', 'gemini', 'groq'], required: true },
  toolType: String,
  inputTokensEstimate: Number,
  outputTokensEstimate: Number,
  estimatedCostUSD: Number,
  createdAt: { type: Date, default: Date.now },
}
```

```javascript
// services/costCalculator.js

const PRICING = {
  claude:   { input: 1.00 / 1_000_000, output: 5.00 / 1_000_000 },
  deepseek: { input: 0.62 / 1_000_000, output: 1.85 / 1_000_000 },
}

function calculateCost(provider, inputTokens, outputTokens) {
  const rates = PRICING[provider]
  if (!rates) return 0  // gemini/groq gratuits ou hors budget Bedrock
  return (inputTokens * rates.input) + (outputTokens * rates.output)
}

module.exports = { calculateCost }
```

---

## Recalcul du budget avec le routing mixte

Hypothese de repartition du volume (a ajuster avec vraies donnees post-
rentree) :
```
Fiche + Quiz + Flashcards (DeepSeek) : ~75% du volume
Annales + Q&A (Claude Haiku)         : ~25% du volume
```

Cout moyen par generation selon le type :
```
DeepSeek (Fiche/Quiz/Flashcards) : ~0,0046$/generation
Claude Haiku (Annales/Q&A)        : ~0,0105$/generation
```

Cout moyen pondere par generation :
```
(0,75 x 0,0046$) + (0,25 x 0,0105$) = 0,00345$ + 0,002625$ = 0,006075$
```

Nombre de generations totales possibles avec 90$ :
```
90$ / 0,006075$ ≈ 14 815 generations
```

Comparaison avec les scenarios precedents :
```
Tout Claude Haiku (avant)     : ~8 570 generations
Routing mixte DeepSeek+Claude : ~14 815 generations (+73%)
```

Gain substantiel sans sacrifier la qualite sur les taches les plus
sensibles (annales, Q&A).

---

## Impact sur la duree de vie du budget (200 etudiants, 5 gen/semaine)

Reprise du calcul avec le nouveau total de generations disponibles :
```
Optimiste (40% actifs/semaine) :
  80 etudiants x 5 = 400 generations/semaine
  14 815 / 400 ≈ 37 semaines ≈ 8,5 mois

Pessimiste (100% actifs/semaine) :
  200 etudiants x 5 = 1000 generations/semaine
  14 815 / 1000 ≈ 14,8 semaines ≈ 3,4 mois
```

Comparaison avec l'ancien calcul (tout Claude Haiku) :
```
                    Ancien (tout Claude)   Nouveau (routing mixte)
Optimiste           5 mois                 8,5 mois
Pessimiste          2 mois                 3,4 mois
```

Amelioration significative de la marge de securite budgetaire grace
au routing par tache.

---

## Ordre d'implementation

```
1. Verifier disponibilite + region exacte de DeepSeek V3.2 sur Bedrock (15 min)
2. Confirmer le format de reponse exact DeepSeek (OpenAI-like vs Anthropic-like) (15 min)
3. Creer generateWithDeepSeek + generateWithClaudeHaiku (1h)
4. Creer le router aiRouter.js avec mapping tache->provider (1h)
5. Mettre a jour AIUsageLog + costCalculator pour tracker les 2 couts (30 min)
6. Tester chaque type de tache (fiche/quiz/flashcards via DeepSeek,
   annale/qa via Claude) avec de vrais documents (1h)
7. Verifier le fallback croise (DeepSeek echoue -> Claude prend le relai
   et inversement) en simulant des erreurs (30 min)
8. Mettre a jour le dashboard admin de suivi budget avec la nouvelle
   projection (~14 815 generations totales au lieu de 8 570) (30 min)
```

## Points d'attention

1. Le format de reponse DeepSeek sur Bedrock peut differer du format
   Anthropic (structure OpenAI-like avec `choices[0].message.content`
   au lieu de `content[0].text`). Verifier precisement dans la doc AWS
   au moment de l'implementation, ne pas assumer un format identique.

2. Le fallback croise Claude <-> DeepSeek (chacun filet de securite de
   l'autre) est plus robuste qu'un fallback direct vers Gemini/Groq en
   cas d'echec, car les deux restent sur Bedrock avec une qualite
   proche - a tester specifiquement en cassant volontairement un appel.

3. Repartition 75/25 du volume est une hypothese de depart - remplacer
   par les vraies proportions observees apres 2-3 semaines d'usage reel
   post-rentree pour affiner le calcul de duree de vie du budget.

4. Continuer a suivre le systeme d'alerte budget (50%/75%/90%) deja
   prevu precedemment, adapte au nouveau total de 90$ mais reparti sur
   deux couts unitaires differents desormais.
