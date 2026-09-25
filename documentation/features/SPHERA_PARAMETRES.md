# Sphera - Page Parametres

## Contexte
Nouvel espace de configuration dans Sphera, qui permet de separer
clairement les parametres propres a Sphera des donnees de profil qui
appartiennent a CampusSphere.

---

## Principe directeur - separation des sources de verite

```
Modale Parametres Sphera (vivent uniquement dans Sphera)
  - Preferences de generation
  - Parametres par outil
  - Theme visuel
  - Vue detaillee du quota/usage

Infos profil (donnees CampusSphere, affichees en lecture seule)
  - Photo, nom, universite, filiere, niveau
  - Recuperees via le SSO Sphera <-> CampusSphere deja fonctionnel
  - Edition redirige vers CampusSphere, jamais d'edition locale
    dans Sphera (evite d'avoir deux sources de verite sur le
    meme profil)
```

---

## Structure de la modale

```
Parametres Sphera
+-- Mon profil (lecture seule)
|     Photo, nom, universite, filiere, niveau
|     -> Bouton "Modifier sur CampusSphere" (redirige)
|
+-- Preferences de generation
|     Langue par defaut, niveau de detail, ton
|
+-- Parametres par outil
|     Quiz : nombre de questions par defaut
|     Audio : voix preferee
|
+-- Usage & Quota
|     Vue detaillee de la consommation hebdomadaire
|
+-- Apparence
      Theme (Sombre / Clair)
```

---

## PARTIE 1 - Backend

### 1. Modele de preferences Sphera

```javascript
// models/SpheraPreferences.js

const SpheraPreferencesSchema = {
  user: { type: ObjectId, ref: 'User', required: true, unique: true },

  // Preferences de generation
  defaultLanguage: { type: String, enum: ['fr', 'en', 'auto'], default: 'auto' },
  detailLevel: { type: String, enum: ['court', 'standard', 'detaille'], default: 'standard' },
  tone: { type: String, enum: ['decontracte', 'formel'], default: 'decontracte' },

  // Parametres par outil
  quiz: {
    defaultQuestionCount: { type: Number, default: 10, min: 5, max: 20 },
    defaultTimeLimit: { type: Number, default: 15 },  // secondes par question
  },
  audio: {
    preferredVoiceStyle: { type: String, enum: ['dialogue', 'monologue'], default: 'dialogue' },
  },

  // Apparence
  theme: { type: String, enum: ['sombre', 'clair'], default: 'sombre' },

  updatedAt: { type: Date, default: Date.now },
}
```

### 2. Endpoints preferences

```javascript
// routes/spheraPreferences.js

// GET /api/sphera/preferences
router.get('/', requireAuth, async (req, res) => {
  let prefs = await SpheraPreferences.findOne({ user: req.user.id })
  if (!prefs) {
    prefs = await SpheraPreferences.create({ user: req.user.id })  // valeurs par defaut
  }
  res.json({ success: true, data: prefs })
})

// PATCH /api/sphera/preferences
router.patch('/', requireAuth, async (req, res) => {
  const updates = req.body
  const prefs = await SpheraPreferences.findOneAndUpdate(
    { user: req.user.id },
    { ...updates, updatedAt: new Date() },
    { new: true, upsert: true }
  )
  res.json({ success: true, data: prefs })
})
```

### 3. Endpoint profil (lecture seule, proxy vers CampusSphere)

```javascript
// routes/spheraProfile.js

// GET /api/sphera/profile
// Reutilise directement les donnees CampusSphere existantes via le
// SSO deja en place - aucune duplication de donnees profil
router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select(
    'firstName lastName avatar university faculty studyYear'
  )
  res.json({
    success: true,
    data: user,
    editUrl: `${process.env.CAMPUSSPHERE_URL}/settings/profile`,
  })
})
```

### 4. Injection des preferences dans les prompts de generation

```javascript
// services/aiRouter.js - mise a jour de generateWithFallback

async function generateWithFallback(text, toolType, userId, options = {}) {
  const [academicContext, prefs] = await Promise.all([
    userId ? getUserAcademicContext(userId) : null,
    userId ? SpheraPreferences.findOne({ user: userId }) : null,
  ])

  const contextPrefix = buildContextPrefix(academicContext)
  const styleInstructions = buildStyleInstructions(prefs)

  const basePrompt = getPrompt(toolType, text, {
    questionCount: options.questionCount || prefs?.quiz?.defaultQuestionCount || 10,
    timeLimit: options.timeLimit || prefs?.quiz?.defaultTimeLimit || 15,
  })

  const fullPrompt = contextPrefix + styleInstructions + basePrompt
  // ... reste du routing inchange (DeepSeek/Claude selon le type)
}

function buildStyleInstructions(prefs) {
  if (!prefs) return ""

  const parts = []
  if (prefs.detailLevel === 'court') parts.push("Sois concis, va a l'essentiel.")
  if (prefs.detailLevel === 'detaille') parts.push("Sois detaille et exhaustif dans tes explications.")
  if (prefs.tone === 'formel') parts.push("Adopte un ton formel et academique.")
  if (prefs.defaultLanguage !== 'auto') parts.push(`Reponds en ${prefs.defaultLanguage === 'fr' ? 'francais' : 'anglais'}.`)

  return parts.length ? parts.join(' ') + '\n\n' : ""
}
```

---

## PARTIE 2 - Frontend

### 1. Page Parametres - structure

```typescript
// src/pages/sphera/Settings.tsx

const SpheraSettings = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <h1 className="text-xl font-semibold">Parametres Sphera</h1>

      <ProfileSection />
      <GenerationPreferencesSection />
      <ToolSettingsSection />
      <UsageSection />
      <AppearanceSection />
    </div>
  )
}
```

### 2. Section Profil (lecture seule)

```typescript
// src/components/sphera/settings/ProfileSection.tsx

const ProfileSection = () => {
  const { data: profile } = useQuery({
    queryKey: ['sphera-profile'],
    queryFn: getSpheraProfile,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <section className="p-5 rounded-xl border border-[#222] bg-[#111]">
      <h2 className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-4">
        Mon profil
      </h2>

      <div className="flex items-center gap-4 mb-4">
        <img src={profile?.avatar} className="w-14 h-14 rounded-full object-cover" />
        <div>
          <p className="font-medium text-white">{profile?.firstName} {profile?.lastName}</p>
          <p className="text-sm text-muted-foreground">
            {profile?.faculty} · {profile?.studyYear} · {profile?.university}
          </p>
        </div>
      </div>

      <a
        href={profile?.editUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#22C55E] hover:underline"
      >
        Modifier sur CampusSphere →
      </a>
    </section>
  )
}
```

### 3. Section Preferences de generation

```typescript
// src/components/sphera/settings/GenerationPreferencesSection.tsx

const GenerationPreferencesSection = () => {
  const { data: prefs } = useQuery({ queryKey: ['sphera-prefs'], queryFn: getSpheraPreferences })
  const { mutate: updatePrefs } = useMutation({
    mutationFn: updateSpheraPreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sphera-prefs'] })
  })

  return (
    <section className="p-5 rounded-xl border border-[#222] bg-[#111]">
      <h2 className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-4">
        Preferences de generation
      </h2>

      <SettingRow label="Langue par defaut">
        <SegmentedControl
          value={prefs?.defaultLanguage}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'fr', label: 'Francais' },
            { value: 'en', label: 'English' },
          ]}
          onChange={(v) => updatePrefs({ defaultLanguage: v })}
        />
      </SettingRow>

      <SettingRow label="Niveau de detail">
        <SegmentedControl
          value={prefs?.detailLevel}
          options={[
            { value: 'court', label: 'Court' },
            { value: 'standard', label: 'Standard' },
            { value: 'detaille', label: 'Detaille' },
          ]}
          onChange={(v) => updatePrefs({ detailLevel: v })}
        />
      </SettingRow>

      <SettingRow label="Ton">
        <SegmentedControl
          value={prefs?.tone}
          options={[
            { value: 'decontracte', label: 'Decontracte' },
            { value: 'formel', label: 'Formel' },
          ]}
          onChange={(v) => updatePrefs({ tone: v })}
        />
      </SettingRow>
    </section>
  )
}
```

### 4. Section Parametres par outil

```typescript
// src/components/sphera/settings/ToolSettingsSection.tsx

const ToolSettingsSection = () => {
  const { data: prefs } = useQuery({ queryKey: ['sphera-prefs'], queryFn: getSpheraPreferences })
  const { mutate: updatePrefs } = useMutation({ mutationFn: updateSpheraPreferences })

  return (
    <section className="p-5 rounded-xl border border-[#222] bg-[#111]">
      <h2 className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-4">
        Parametres par outil
      </h2>

      <SettingRow label="Nombre de questions (Quiz)">
        <Slider
          min={5} max={20} step={1}
          value={prefs?.quiz?.defaultQuestionCount || 10}
          onChange={(v) => updatePrefs({ quiz: { ...prefs.quiz, defaultQuestionCount: v } })}
        />
      </SettingRow>

      <SettingRow label="Temps par question (secondes)">
        <Slider
          min={10} max={30} step={5}
          value={prefs?.quiz?.defaultTimeLimit || 15}
          onChange={(v) => updatePrefs({ quiz: { ...prefs.quiz, defaultTimeLimit: v } })}
        />
      </SettingRow>

      <SettingRow label="Style audio">
        <SegmentedControl
          value={prefs?.audio?.preferredVoiceStyle}
          options={[
            { value: 'dialogue', label: 'Dialogue (podcast)' },
            { value: 'monologue', label: 'Voix unique' },
          ]}
          onChange={(v) => updatePrefs({ audio: { preferredVoiceStyle: v } })}
        />
      </SettingRow>
    </section>
  )
}
```

### 5. Section Usage & Quota

```typescript
// src/components/sphera/settings/UsageSection.tsx

const UsageSection = () => {
  const { data: quota } = useQuery({ queryKey: ['generation-quota'], queryFn: getGenerationQuota })

  return (
    <section className="p-5 rounded-xl border border-[#222] bg-[#111]">
      <h2 className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-4">
        Usage & Quota
      </h2>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">Cette semaine</span>
        <span className="text-sm font-medium">{quota?.used} / {quota?.limit}</span>
      </div>
      <div className="h-2 rounded-full bg-[#222] overflow-hidden mb-4">
        <div className="h-full bg-[#22C55E] rounded-full transition-all"
             style={{ width: `${Math.min(100, (quota?.used / quota?.limit) * 100)}%` }} />
      </div>

      <p className="text-xs text-muted-foreground">
        Renouvellement le {new Date(quota?.resetsOn).toLocaleDateString('fr-FR')}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Q&A et generations sur selection comptent 0,5 · generations
        completes comptent 1
      </p>

      {!quota?.isPremium && (
        <a href="/sphera/premium" className="inline-block mt-3 text-sm text-[#22C55E] hover:underline">
          Passer a Sphera Premium pour plus de generations →
        </a>
      )}
    </section>
  )
}
```

### 6. Section Apparence

```typescript
// src/components/sphera/settings/AppearanceSection.tsx

const AppearanceSection = () => {
  const { data: prefs } = useQuery({ queryKey: ['sphera-prefs'], queryFn: getSpheraPreferences })
  const { mutate: updatePrefs } = useMutation({
    mutationFn: updateSpheraPreferences,
    onSuccess: (data) => {
      // Appliquer le theme immediatement, sans attendre un refresh
      document.documentElement.setAttribute('data-theme', data.theme)
    }
  })

  return (
    <section className="p-5 rounded-xl border border-[#222] bg-[#111]">
      <h2 className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-4">
        Apparence
      </h2>

      <SettingRow label="Theme">
        <SegmentedControl
          value={prefs?.theme}
          options={[
            { value: 'sombre', label: '🌙 Sombre' },
            { value: 'clair', label: '☀️ Clair' },
          ]}
          onChange={(v) => updatePrefs({ theme: v })}
        />
      </SettingRow>
    </section>
  )
}
```

### 7. Variables CSS pour le theme clair

Le design system Sphera existant est concu dark-first (voir
ANTIGRAVITY_SPHERA_FRONTEND.md). Ajouter le pendant clair :

```css
/* styles/globals.css */

:root[data-theme="sombre"] {
  --sphera-bg: #0A0A0A;
  --sphera-surface: #111111;
  --sphera-surface-2: #1A1A1A;
  --sphera-border: #222222;
  --sphera-text: #F5F5F5;
  --sphera-text-muted: #888888;
}

:root[data-theme="clair"] {
  --sphera-bg: #FAFAFA;
  --sphera-surface: #FFFFFF;
  --sphera-surface-2: #F3F4F6;
  --sphera-border: #E5E7EB;
  --sphera-text: #111111;
  --sphera-text-muted: #6B7280;
}

/* --sphera-green (#22C55E) reste identique dans les deux themes -
   c'est la couleur de marque, elle ne change pas */
```

```typescript
// Charger le theme au demarrage de l'app, avant meme le premier rendu
// src/main.tsx ou App.tsx

useEffect(() => {
  const loadTheme = async () => {
    const prefs = await getSpheraPreferences()
    document.documentElement.setAttribute('data-theme', prefs.theme || 'sombre')
  }
  loadTheme()
}, [])
```

---

## Ordre d'implementation

```
1. Modele SpheraPreferences + endpoints CRUD (1h)
2. Endpoint profil lecture seule (proxy CampusSphere) (30 min)
3. Injection des preferences dans generateWithFallback (1h)
4. Frontend - structure page Parametres + sections (2-3h)
5. Frontend - composants SegmentedControl / Slider reutilisables (1h)
6. Variables CSS theme clair + logique de bascule (1-2h)
7. Tests : verifier que changer une preference affecte bien la
   prochaine generation (nombre de questions, langue, ton) (1h)
```

---

## Points d'attention

1. **Le profil reste en lecture seule dans Sphera** - toute tentative
   d'edition (nom, photo, universite) doit rediriger vers CampusSphere,
   jamais de formulaire d'edition duplique dans Sphera. Ca eviterait
   des incoherences entre les deux bases si les deux pouvaient etre
   modifiees independamment.

2. **Preferences vs contexte academique** - ne pas confondre les deux
   systemes deja documentes : le contexte academique (universite,
   filiere, niveau, voir BEDROCK_MIGRATION_CONTEXT.md Partie 2) vient
   de CampusSphere et personnalise automatiquement le prompt. Les
   preferences Sphera (langue, ton, detail) sont un choix explicite
   de l'utilisateur, stocke separement, propre a Sphera uniquement.

3. **Nombre de questions Quiz et cout quota** - si un utilisateur
   choisit 20 questions au lieu de 10 par defaut, le cout reel en
   tokens de sortie augmente proportionnellement. Le systeme de quota
   actuel (1 generation = 1 unite peu importe la taille) ne reflete
   pas cette variation - a surveiller si les utilisateurs poussent
   systematiquement vers le max, et ajuster le cout quota en fonction
   si necessaire apres avoir des vraies donnees d'usage.

4. **Theme clair et coherence de marque** - le vert malachite
   (#22C55E) reste identique dans les deux themes, c'est la couleur
   de marque Sphera. Seuls les fonds/textes changent entre sombre et
   clair.
