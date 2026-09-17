# Sphera — Migration vers AWS Bedrock + Contexte Profil Utilisateur

## Contexte
Deux changements a faire ensemble :
1. Remplacer l'appel API Anthropic direct par Amazon Bedrock (paye avec
   les credits AWS disponibles, ~90$ - largement suffisant, environ
   34 000+ generations possibles avec Claude Haiku).
2. Injecter le contexte profil de l'utilisateur (universite, filiere,
   niveau) dans les prompts Sphera - donnees deja collectees a
   l'inscription CampusSphere, pas de nouvel onboarding necessaire.

Stack backend : Node.js + Express (migration recente depuis Django)

---

## PARTIE 1 - Migration vers Bedrock

### 1. Installation

```bash
npm install @aws-sdk/client-bedrock-runtime
```

### 2. Variables d'environnement

```env
# Remplacer ou ajouter a cote de ANTHROPIC_API_KEY existant
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
```

Verifier au prealable que Bedrock + le modele Claude Haiku sont bien
actives sur le compte AWS (parfois necessite une demande d'acces
manuelle dans la console Bedrock, section "Model access").

### 3. Remplacer generate_with_claude par generate_with_bedrock

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

async function generateWithBedrock(prompt) {
  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }]
    })
  })

  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  const rawText = responseBody.content[0].text

  return cleanJson(rawText)  // reutilise la fonction cleanJson existante
}

module.exports = { generateWithBedrock }
```

### 4. Mettre a jour l'orchestrateur de fallback

```javascript
// services/aiProviders.js - remplacer generate_with_claude dans PROVIDERS

const PROVIDERS = [
  ["bedrock", generateWithBedrock],   // remplace ["anthropic", generateWithClaude]
  ["gemini",  generateWithGemini],    // inchange
  ["groq",    generateWithGroq],      // inchange
]

async function generateWithFallback(text, toolType) {
  const prompt = getPrompt(toolType, text)
  let lastError = null

  for (const [providerName, providerFn] of PROVIDERS) {
    try {
      logger.info(`[AI] Trying: ${providerName}`)
      const result = await providerFn(prompt)
      logger.info(`[AI] Success: ${providerName}`)
      return result
    } catch (e) {
      logger.warn(`[AI] ${providerName} failed: ${e.message}`)
      lastError = e
    }
  }

  throw new Error(`Tous les providers IA ont echoue. Derniere erreur : ${lastError}`)
}
```

### 5. Ce qui ne change PAS

```
Tous les prompts existants (FICHE_PROMPT, QUIZ_PROMPT, FLASHCARDS_PROMPT,
QA_PROMPT, ANNALE_PROMPT, SUGGESTIONS_PROMPT) restent identiques.
Seul le transport de l'appel change (Bedrock au lieu d'API Anthropic
directe) - la qualite de sortie doit rester la meme puisque c'est le
meme modele Claude Haiku derriere.
```

Ne PAS toucher a la logique de generation elle-meme, uniquement au
provider qui l'execute.

---

## PARTIE 2 - Contexte profil utilisateur dans les prompts

### 1. Recuperer le profil au moment de la generation

Le profil (universite, filiere, niveau) est deja collecte via
CompleteProfile.tsx / Register.tsx cote CampusSphere et accessible
via le SSO deja fonctionnel entre Sphera et CampusSphere.

```javascript
// services/userContext.js

async function getUserAcademicContext(userId) {
  const user = await User.findById(userId).select(
    'firstName university faculty studyYear language'
  )

  if (!user) return null

  return {
    firstName: user.firstName,
    university: user.university || null,
    faculty: user.faculty || null,
    studyYear: user.studyYear || null,
    language: user.language || 'fr',
  }
}

function buildContextPrefix(context) {
  if (!context || (!context.university && !context.faculty)) {
    // Pas de contexte disponible (utilisateur invite sur Sphera
    // standalone sans compte, ou profil incomplet) - prompt neutre
    return ""
  }

  const parts = []
  if (context.firstName) parts.push(`l'etudiant(e) s'appelle ${context.firstName}`)
  if (context.faculty) parts.push(`en ${context.faculty}`)
  if (context.studyYear) parts.push(`niveau ${context.studyYear}`)
  if (context.university) parts.push(`a ${context.university}`)

  return `Contexte : tu aides ${parts.join(', ')}. Adapte ton vocabulaire et tes exemples a ce niveau d'etudes.\n\n`
}

module.exports = { getUserAcademicContext, buildContextPrefix }
```

### 2. Injecter le contexte dans les prompts existants

```javascript
// services/aiProviders.js - modifier generateWithFallback

const { getUserAcademicContext, buildContextPrefix } = require('./userContext')

async function generateWithFallback(text, toolType, userId) {
  let contextPrefix = ""

  if (userId) {
    const context = await getUserAcademicContext(userId)
    contextPrefix = buildContextPrefix(context)
  }

  const basePrompt = getPrompt(toolType, text)
  const fullPrompt = contextPrefix + basePrompt

  // ... reste identique (boucle sur PROVIDERS)
}
```

### 3. Adapter les prompts pour laisser la place au contexte

```javascript
// prompts.js - exemple avec FICHE_PROMPT
// Le contexte est prepend automatiquement par buildContextPrefix,
// donc les prompts existants n'ont PAS besoin d'etre reecrits.
// Le texte final envoye au modele ressemble a :

/*
Contexte : tu aides l'etudiant(e) s'appelle Max, en Computer Engineering,
niveau 300, a IUC Douala. Adapte ton vocabulaire et tes exemples a ce
niveau d'etudes.

Tu es Sphera, l'assistante academique de CampusSphere. Tu es intelligente,
chaleureuse et directe...
[reste du prompt FICHE_PROMPT existant, inchange]
*/
```

### 4. Cas du mode invite (Sphera standalone sans compte)

```javascript
// Si userId est null/undefined (utilisateur non connecte sur
// sphera.campussphere.app en mode invite), buildContextPrefix
// retourne une chaine vide - comportement actuel inchange,
// pas de degradation pour les utilisateurs sans compte.
```

### 5. Mettre a jour les appels existants pour passer userId

```javascript
// routes/studySessions.js - exemple sur l'endpoint de generation

router.post('/generate/from-resource', requireAuth, async (req, res) => {
  const { resourceId, toolType } = req.body
  const text = await extractTextFromResource(resourceId)

  // Avant : generateWithFallback(text, toolType)
  // Apres :
  const result = await generateWithFallback(text, toolType, req.user?.id)

  res.json({ success: true, data: result })
})
```

Repeter ce changement (ajouter `req.user?.id` en 3eme argument) sur
tous les endpoints qui appellent `generateWithFallback` : fiche, quiz,
flashcards, Q&A, annales, suggestions.

---

## Ordre d'implementation

```
1. Verifier acces Bedrock + Claude Haiku actives sur le compte AWS (15 min)
2. Installer @aws-sdk/client-bedrock-runtime (5 min)
3. Creer generateWithBedrock, remplacer dans PROVIDERS (30 min)
4. Tester une generation simple pour valider Bedrock fonctionne (15 min)
5. Creer userContext.js (getUserAcademicContext + buildContextPrefix) (30 min)
6. Injecter le contexte dans generateWithFallback (30 min)
7. Mettre a jour tous les endpoints pour passer userId (30 min)
8. Tester avec un compte ayant un profil complet vs un compte invite (30 min)
```

## Points d'attention

1. **Cout Bedrock vs API Anthropic directe** - verifier que le prix
   par token est bien similaire (generalement le cas pour Claude sur
   Bedrock), pour confirmer que le calcul de ~34 000 generations tient.

2. **Region AWS** - Claude n'est pas disponible sur Bedrock dans toutes
   les regions. Verifier la disponibilite dans la region choisie avant
   de tout migrer (us-east-1 et us-west-2 sont generalement les plus
   completes).

3. **Ne pas sur-complexifier le contexte** - se limiter a universite/
   filiere/niveau/prenom. Ne pas ajouter de style d'apprentissage,
   preferences pedagogiques ou autre - donnees non fiables et sans
   valeur prouvee, inutile de construire un onboarding pour ca.

4. **Fallback Gemini/Groq inchange** - seul Claude change de transport
   (Bedrock au lieu d'API directe). Le reste de la chaine de fallback
   reste exactement comme avant.

5. **Contexte optionnel, jamais bloquant** - si le profil est incomplet
   ou l'utilisateur est un invite Sphera standalone, la generation doit
   fonctionner normalement sans contexte, pas d'erreur ni de blocage.

---

## PARTIE 3 - Limite d'usage + Suivi de consommation + Fallback protecteur

### Contexte critique
Budget total : ~90$ credits AWS = ~8570 generations Claude Haiku 4.5
sur Bedrock (region Afrique/Le Cap). Aucune autre source de revenu
pour recharger ces credits. Il faut absolument eviter une rupture
brutale en pleine periode d'activite (rentree, examens).

Limite retenue : **5 generations par etudiant par semaine**.
Calcul de tenue estime :
```
Scenario optimiste (40% des etudiants actifs/semaine) : ~5 mois
Scenario pessimiste (100% des etudiants actifs/semaine) : ~2 mois
```

### 1. Modele de tracking d'usage

```javascript
// models/GenerationUsage.js

const GenerationUsageSchema = {
  user: { type: ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },  // lundi de la semaine en cours
  count: { type: Number, default: 0 },
}

// Index compose pour lookup rapide user + semaine
GenerationUsageSchema.index({ user: 1, weekStartDate: 1 }, { unique: true })
```

```javascript
// utils/weekHelper.js

function getWeekStartDate(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)  // lundi comme debut de semaine
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

module.exports = { getWeekStartDate }
```

### 2. Middleware de verification de quota

```javascript
// middleware/generationQuota.js

const { getWeekStartDate } = require('../utils/weekHelper')

const WEEKLY_LIMIT = 5

const checkGenerationQuota = async (req, res, next) => {
  const userId = req.user?.id
  if (!userId) return next()  // invite sans compte - gere separement, voir note plus bas

  const weekStart = getWeekStartDate()

  let usage = await GenerationUsage.findOne({ user: userId, weekStartDate: weekStart })

  if (!usage) {
    usage = await GenerationUsage.create({ user: userId, weekStartDate: weekStart, count: 0 })
  }

  if (usage.count >= WEEKLY_LIMIT) {
    return res.status(429).json({
      success: false,
      error: "weekly_limit_reached",
      message: `Tu as utilise tes ${WEEKLY_LIMIT} generations Sphera cette semaine. Ca revient lundi prochain !`,
      resetsOn: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
    })
  }

  req.generationUsage = usage
  next()
}

// A appeler APRES une generation reussie (pas avant, pour ne pas
// decrementer un quota si la generation echoue)
const incrementGenerationQuota = async (usage) => {
  usage.count += 1
  await usage.save()
}

module.exports = { checkGenerationQuota, incrementGenerationQuota, WEEKLY_LIMIT }
```

### 3. Integration dans les routes de generation

```javascript
// routes/studySessions.js

const { checkGenerationQuota, incrementGenerationQuota } = require('../middleware/generationQuota')

router.post('/generate/from-resource', requireAuth, checkGenerationQuota, async (req, res) => {
  const { resourceId, toolType } = req.body
  const text = await extractTextFromResource(resourceId)

  const result = await generateWithFallback(text, toolType, req.user?.id)

  // Incrementer seulement si la generation a reussi
  await incrementGenerationQuota(req.generationUsage)

  res.json({ success: true, data: result })
})
```

Repeter ce pattern (ajouter `checkGenerationQuota` dans la chaine de
middlewares + appeler `incrementGenerationQuota` apres succes) sur
tous les endpoints de generation : fiche, quiz, flashcards, Q&A par
message, annales.

### 4. Note sur le mode invite (Sphera standalone sans compte)

```
Pour un utilisateur sans compte (mode invite sur sphera.campussphere.app),
le quota par utilisateur n'est pas applicable directement. Deux options :
  a) Bloquer completement la generation invite (forcer la creation
     de compte pour utiliser Sphera) - recommande vu la contrainte budget
  b) Tracker par IP avec une limite plus stricte (ex: 2/semaine)
     - plus complexe, facilement contournable, a eviter pour l'instant
```
Recommandation : option (a) - le mode invite sert a decouvrir l'interface
et convertir vers un compte, pas a generer du contenu illimite gratuitement.

### 5. Frontend - affichage du quota restant

```typescript
// src/components/sphera/QuotaIndicator.tsx

const QuotaIndicator = () => {
  const { data: quota } = useQuery({
    queryKey: ['generation-quota'],
    queryFn: getGenerationQuota,
    staleTime: 60 * 1000,
  })

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-2">
      <span>{quota?.remaining} / {quota?.limit} générations cette semaine</span>
      <ProgressBar value={(quota?.used / quota?.limit) * 100} className="w-16 h-1.5" />
    </div>
  )
}
```

```javascript
// GET /api/study/quota - endpoint pour le frontend
router.get('/quota', requireAuth, async (req, res) => {
  const weekStart = getWeekStartDate()
  const usage = await GenerationUsage.findOne({ user: req.user.id, weekStartDate: weekStart })
  const used = usage?.count || 0

  res.json({
    success: true,
    data: { used, remaining: Math.max(0, WEEKLY_LIMIT - used), limit: WEEKLY_LIMIT }
  })
})
```

---

## PARTIE 4 - Dashboard admin de suivi de consommation Bedrock (Intégrer a l'interface admin existante de CapmpusSphere)

### Objectif
Voir en temps reel combien des 90$ de credits AWS ont ete consommes,
et projeter la date de rupture pour reagir AVANT que ca arrive, pas
apres.

### 1. Tracker chaque appel Bedrock avec son cout estime

```javascript
// models/AIUsageLog.js

const AIUsageLogSchema = {
  provider: { type: String, enum: ['bedrock', 'gemini', 'groq'], required: true },
  toolType: String,           // 'fiche', 'quiz', 'flashcards', 'qa', 'annale'
  inputTokensEstimate: Number,
  outputTokensEstimate: Number,
  estimatedCostUSD: Number,
  createdAt: { type: Date, default: Date.now },
}
```

```javascript
// services/aiProviders.js - logger le cout a chaque appel Bedrock

const BEDROCK_INPUT_PRICE = 1.00 / 1_000_000   // 1$ / million tokens
const BEDROCK_OUTPUT_PRICE = 5.00 / 1_000_000  // 5$ / million tokens

async function generateWithBedrock(prompt, toolType) {
  const command = new InvokeModelCommand({ /* ... comme avant ... */ })
  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  const inputTokens = responseBody.usage?.input_tokens || 0
  const outputTokens = responseBody.usage?.output_tokens || 0
  const cost = (inputTokens * BEDROCK_INPUT_PRICE) + (outputTokens * BEDROCK_OUTPUT_PRICE)

  await AIUsageLog.create({
    provider: 'bedrock', toolType,
    inputTokensEstimate: inputTokens, outputTokensEstimate: outputTokens,
    estimatedCostUSD: cost,
  })

  return cleanJson(responseBody.content[0].text)
}
```

### 2. Endpoint admin - vue consommation + projection

```javascript
// routes/admin.js

router.get('/ai-usage-summary', requireAdmin, async (req, res) => {
  const TOTAL_BUDGET_USD = 90

  const totalSpent = await AIUsageLog.aggregate([
    { $match: { provider: 'bedrock' } },
    { $group: { _id: null, total: { $sum: '$estimatedCostUSD' } } }
  ])
  const spent = totalSpent[0]?.total || 0

  // Consommation des 7 derniers jours pour projeter la tendance
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentSpent = await AIUsageLog.aggregate([
    { $match: { provider: 'bedrock', createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: null, total: { $sum: '$estimatedCostUSD' } } }
  ])
  const weeklyRate = recentSpent[0]?.total || 0
  const remaining = TOTAL_BUDGET_USD - spent
  const weeksRemaining = weeklyRate > 0 ? (remaining / weeklyRate).toFixed(1) : null

  res.json({
    success: true,
    data: {
      totalBudget: TOTAL_BUDGET_USD,
      spent: spent.toFixed(2),
      remaining: remaining.toFixed(2),
      percentUsed: ((spent / TOTAL_BUDGET_USD) * 100).toFixed(1),
      weeklyBurnRate: weeklyRate.toFixed(2),
      estimatedWeeksRemaining: weeksRemaining,
    }
  })
})
```

### 3. Alerte automatique a 50% / 75% / 90%

```javascript
// jobs/checkBudgetAlert.js - a executer via cron quotidien

const cron = require('node-cron')

const ALERT_THRESHOLDS = [50, 75, 90]
let lastAlertSent = 0

async function checkBudgetAndAlert() {
  const TOTAL_BUDGET_USD = 90
  const totalSpent = await AIUsageLog.aggregate([
    { $match: { provider: 'bedrock' } },
    { $group: { _id: null, total: { $sum: '$estimatedCostUSD' } } }
  ])
  const spent = totalSpent[0]?.total || 0
  const percentUsed = (spent / TOTAL_BUDGET_USD) * 100

  for (const threshold of ALERT_THRESHOLDS) {
    if (percentUsed >= threshold && lastAlertSent < threshold) {
      lastAlertSent = threshold
      // Envoyer notification a l'equipe (email, Slack, ou notification admin)
      await notifyTeamBudgetAlert(threshold, spent, TOTAL_BUDGET_USD)
    }
  }
}

cron.schedule('0 8 * * *', checkBudgetAndAlert)  // tous les jours a 8h
```

### 4. Fallback protecteur automatique - basculer sur Groq avant la rupture

```javascript
// services/aiProviders.js - modifier generateWithFallback

const BUDGET_SAFETY_THRESHOLD_PERCENT = 90  // au-dela, on protege le budget restant

async function getBedrockUsagePercent() {
  const TOTAL_BUDGET_USD = 90
  const totalSpent = await AIUsageLog.aggregate([
    { $match: { provider: 'bedrock' } },
    { $group: { _id: null, total: { $sum: '$estimatedCostUSD' } } }
  ])
  const spent = totalSpent[0]?.total || 0
  return (spent / TOTAL_BUDGET_USD) * 100
}

async function generateWithFallback(text, toolType, userId) {
  const contextPrefix = userId ? buildContextPrefix(await getUserAcademicContext(userId)) : ""
  const prompt = contextPrefix + getPrompt(toolType, text)

  const usagePercent = await getBedrockUsagePercent()

  // Si le budget Bedrock est presque epuise, sauter directement a Gemini/Groq
  // pour preserver les derniers credits pour les cas critiques (ex: usage prof)
  const providers = usagePercent >= BUDGET_SAFETY_THRESHOLD_PERCENT
    ? [["gemini", generateWithGemini], ["groq", generateWithGroq]]
    : [["bedrock", (p) => generateWithBedrock(p, toolType)], ["gemini", generateWithGemini], ["groq", generateWithGroq]]

  let lastError = null
  for (const [providerName, providerFn] of providers) {
    try {
      return await providerFn(prompt)
    } catch (e) {
      lastError = e
    }
  }
  throw new Error(`Tous les providers IA ont echoue. Derniere erreur : ${lastError}`)
}
```

---

## Ordre d'implementation complet (Parties 1 a 4)

```
1. Migration Bedrock de base (Partie 1) - 1-2h
2. Contexte profil utilisateur (Partie 2) - 1-2h
3. Modele + middleware quota hebdomadaire (Partie 3.1-3.3) - 1-2h
4. Frontend indicateur de quota (Partie 3.5) - 1h
5. Tracking cout par appel Bedrock (Partie 4.1) - 1h
6. Dashboard admin consommation (Partie 4.2) - 1-2h
7. Alerte automatique cron (Partie 4.3) - 30 min
8. Fallback protecteur automatique (Partie 4.4) - 30 min
9. Test complet - simuler plusieurs semaines d'usage pour valider
   que le quota, le tracking et le fallback fonctionnent ensemble
```

## Points d'attention critiques

1. **Priorite absolue** : implementer le tracking de cout (Partie 4)
   AVANT le lancement rentree. Sans visibilite sur la consommation
   reelle, impossible de savoir si vous etes scenario optimiste ou
   pessimiste avant qu'il soit trop tard.

2. **Le quota de 5/semaine n'est pas negociable a la hausse** sans
   revoir le budget - tenu par le calcul : 5/mois optimiste, 2 mois
   pessimiste avec 200 etudiants actifs.

3. **Mode invite Sphera standalone bloque cote generation** - seule
   la decouverte de l'interface est libre, la generation necessite
   un compte pour etre trackee et quotee correctement.

4. **Reconsiderer le seuil de securite (90%)** si besoin - possibilite
   de le descendre a 80% pour garder une marge plus large avant la
   bascule automatique vers Groq/Gemini uniquement.
