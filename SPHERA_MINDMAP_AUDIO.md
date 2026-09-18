# Sphera V3 - Cartes mentales + Resume audio

## Contexte
Extensions naturelles du moteur Sphera existant (meme logique que
Fiche/Quiz/Flashcards : upload -> generation -> affichage/telechargement).
Reutilise le routing IA deja en place (DeepSeek pour taches simples,
Claude Haiku pour taches complexes - a trancher ci-dessous pour ces
2 nouveaux outils).

Stack : Backend Node.js + Express, Frontend React 18 + TypeScript +
Vite + Tailwind + Shadcn/UI.

---

## PARTIE 1 - Cartes mentales (Mind Maps)

### Choix du modele IA
Generation de structure hierarchique (JSON arborescent) - tache
proche de Fiche/Quiz en complexite -> **DeepSeek V3.2** comme
provider principal, Claude Haiku en fallback (meme logique que le
routing existant pour Fiche/Quiz/Flashcards).

### 1. Prompt de generation

```javascript
// prompts.js

const MINDMAP_PROMPT = `
Tu es Sphera, l'assistante academique de CampusSphere. Tu es
intelligente, chaleureuse et directe. Tu paries aux etudiants comme
une grande soeur brillante qui veut vraiment les voir reussir.

Depuis ce cours, genere une carte mentale hierarchique en JSON
uniquement. Aucun texte avant ou apres le JSON.

Structure : un noeud central (le sujet principal), des branches
principales (les grands themes/chapitres), et des sous-branches
(les sous-points, definitions, exemples cles).
Interface navigable (zoom + deplacement libre), donc pas besoin
de tout faire tenir sur un seul ecran fixe.
Maximum 4 niveaux de profondeur. Maximum 10 branches principales
depuis le noeud central. Maximum 6 sous-branches par branche
principale. Reste raisonnable si le cours est court - ne force pas
le nombre max de branches si le contenu ne le justifie pas.

Format JSON strict :
{
  "titre": "Titre du cours",
  "noeud_central": "Concept principal en 2-4 mots",
  "branches": [
    {
      "label": "Theme principal 1",
      "couleur": "vert" | "bleu" | "orange" | "violet" | "rose",
      "sous_branches": [
        { "label": "Sous-point 1" },
        { "label": "Sous-point 2" }
      ]
    }
  ]
}

Cours :
{text}
`
```

### 2. Backend - endpoint et generation

```javascript
// routes/studySessions.js

router.post('/generate/mindmap', requireAuth, checkGenerationQuota, async (req, res) => {
  const { resourceId } = req.body
  const text = await extractTextFromResource(resourceId)

  const result = await generateWithFallback(text, 'mindmap', req.user?.id)
  await incrementGenerationQuota(req.generationUsage)

  const session = await StudySession.create({
    owner: req.user.id,
    resource: resourceId,
    tool_type: 'mindmap',
    content: result,
  })

  res.json({ success: true, data: session })
})
```

```javascript
// Mise a jour du router IA (aiRouter.js) - ajouter mindmap au mapping existant

const TASK_PRIMARY_PROVIDER = {
  fiche: 'deepseek',
  quiz: 'deepseek',
  flashcards: 'deepseek',
  mindmap: 'deepseek',      // nouveau
  annale: 'claude',
  qa: 'claude',
}
```

### 3. Frontend - composant de rendu visuel

Utiliser une librairie de visualisation arborescente legere plutot
que de tout dessiner en SVG manuel.

```bash
npm install reactflow
```

```typescript
// src/components/study/MindMapView.tsx

import { useRef } from 'react'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'

interface MindMapData {
  titre: string
  noeud_central: string
  branches: {
    label: string
    couleur: string
    sous_branches: { label: string }[]
  }[]
}

const COULEURS = {
  vert: '#22C55E',
  bleu: '#3B82F6',
  orange: '#F97316',
  violet: '#A855F7',
  rose: '#EC4899',
}

const buildFlowData = (data: MindMapData): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Noeud central
  nodes.push({
    id: 'central',
    data: { label: data.noeud_central },
    position: { x: 400, y: 300 },
    style: {
      background: '#111', border: '2px solid #22C55E',
      color: '#fff', borderRadius: '12px', padding: '12px 20px',
      fontWeight: 'bold', fontSize: '16px',
    }
  })

  // Branches principales en cercle autour du centre
  const angleStep = (2 * Math.PI) / data.branches.length
  data.branches.forEach((branche, i) => {
    const angle = i * angleStep
    const radius = 250
    const x = 400 + radius * Math.cos(angle)
    const y = 300 + radius * Math.sin(angle)
    const branchId = `branch-${i}`
    const color = COULEURS[branche.couleur] || COULEURS.vert

    nodes.push({
      id: branchId,
      data: { label: branche.label },
      position: { x, y },
      style: {
        background: '#1a1a1a', border: `2px solid ${color}`,
        color: '#fff', borderRadius: '10px', padding: '8px 16px',
      }
    })
    edges.push({ id: `e-central-${branchId}`, source: 'central', target: branchId, style: { stroke: color } })

    // Sous-branches
    branche.sous_branches.forEach((sb, j) => {
      const subId = `${branchId}-sub-${j}`
      const subAngle = angle + (j - branche.sous_branches.length / 2) * 0.3
      const subRadius = radius + 150
      nodes.push({
        id: subId,
        data: { label: sb.label },
        position: { x: 400 + subRadius * Math.cos(subAngle), y: 300 + subRadius * Math.sin(subAngle) },
        style: {
          background: '#0f0f0f', border: `1px solid ${color}66`,
          color: '#ccc', borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
        }
      })
      edges.push({ id: `e-${branchId}-${subId}`, source: branchId, target: subId, style: { stroke: `${color}66` } })
    })
  })

  return { nodes, edges }
}

const MindMapView = ({ data }: { data: MindMapData }) => {
  const { nodes, edges } = buildFlowData(data)
  const reactFlowInstance = useRef(null)

  const handleRecenter = () => {
    reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 })
  }

  return (
    <div className="relative h-[600px] w-full rounded-xl border border-[#222] bg-[#0a0a0a]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onInit={(instance) => { reactFlowInstance.current = instance }}
        // Navigation tactile mobile - zoom pinch + pan glisser actives
        panOnDrag={true}
        zoomOnPinch={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        minZoom={0.3}
        maxZoom={2.5}
        // Evite le scroll de page accidentel pendant l'interaction
        // avec la carte sur mobile
        preventScrolling={true}
      >
        <Background color="#222" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Bouton recentrer - utile apres navigation libre sur un
          cours dense avec beaucoup de branches */}
      <button
        onClick={handleRecenter}
        className="absolute top-4 right-4 z-10 px-3 py-2 rounded-lg
                   bg-[#111] border border-[#22C55E]/30 text-[#22C55E]
                   text-xs font-medium hover:bg-[#22C55E]/10
                   transition-all"
      >
        ⊙ Centrer la vue
      </button>
    </div>
  )
}

export default MindMapView
```

### 4. Reutiliser le telechargement PDF existant
La carte mentale peut etre capturee avec le meme hook `useDownloadPDF`
deja construit pour Fiche/Annales - juste cibler l'element contenant
le canvas ReactFlow.

---


## PARTIE 2 - Resume audio (format dialogue a 2 voix, style podcast)

### Choix des services

**Script de dialogue** : reutilise le moteur IA existant (DeepSeek,
meme famille que Fiche - tache de generation de texte structure).

**Text-to-Speech** : Azure Speech (voix neuronales), deja dans les
credits gratuits Azure for Students identifies precedemment.

**Stockage des fichiers audio generes** : S3, deja utilise depuis le
debut du projet pour les medias utilisateurs et les ressources.
Budget S3 disponible : 22$ (separe des 90$ Bedrock/IA). Reutiliser
la logique d'upload S3 deja existante dans le backend, pas de nouveau
systeme de stockage a introduire.

### Format retenu : dialogue a 2 voix, style podcast

Plutot qu'une voix unique qui relit le texte (monotone, peu engageant),
le format retenu est un dialogue entre 2 "personnages" qui discutent
du cours - dans l'esprit de ce que fait Google NotebookLM avec ses
"Audio Overviews".

Nuance technique importante : ce n'est pas une improvisation en temps
reel comme NotebookLM (qui utilise un systeme different, plus complexe).
C'est un **script de dialogue pre-genere par le LLM**, puis joue par
2 voix neuronales differentes via SSML. Le resultat sonne naturel et
engageant, meme si ce n'est pas une improvisation live.

### Quota gratuit Azure Speech - calcul reel

```
Quota gratuit : 500 000 caracteres/mois (voix neuronales Standard)
Vitesse de parole moyenne (TTS neuronal) : ~850-900 caracteres/minute

500 000 / 875 (moyenne) = environ 571 minutes/mois gratuites
= environ 9,5 heures d'audio par mois, gratuitement
```

Avec le format dialogue (plus long qu'un monologue du fait des
questions/reponses/reformulations) :
```
Duree cible par dialogue : 4-6 minutes (au lieu de 2-4 min en monologue)
571 minutes / 5 min (moyenne) = environ 95-140 dialogues generables/mois
```

Suffisant pour l'echelle actuelle du projet, a suivre separement du
budget Bedrock deja tracke (dashboard admin distinct ou section
additionnelle du meme dashboard).

### 1. Prompt de generation du script de dialogue

```javascript
// prompts.js

const AUDIO_DIALOGUE_PROMPT = `
Tu es Sphera, l'assistante academique de CampusSphere. Tu es
intelligente, chaleureuse et directe.

Depuis ce cours, genere un script de dialogue entre 2 etudiants qui
discutent du cours de maniere naturelle et engageante, comme un
podcast educatif. Un etudiant (A) explique et enseigne, l'autre (B)
pose des questions pertinentes, reformule, demande des clarifications
ou des exemples concrets - comme une vraie conversation d'etude entre
pairs, pas un cours magistral.

Regles :
- Phrases courtes, ton conversationnel et naturel
- B pose au moins 3-4 vraies questions pendant le dialogue
- A donne des exemples concrets, pas juste de la theorie abstraite
- Alterner les tours de parole de maniere equilibree
- Duree cible : 4-6 minutes de dialogue (environ 600-900 mots au total)
- Conclure par un recap rapide des points cles a retenir

Format JSON strict, aucun texte avant ou apres :
{
  "titre": "Titre du cours",
  "dialogue": [
    { "speaker": "A", "text": "..." },
    { "speaker": "B", "text": "..." },
    { "speaker": "A", "text": "..." }
  ]
}

Cours :
{text}
`
```

### 2. Backend - generation script + synthese SSML a 2 voix

```bash
npm install microsoft-cognitiveservices-speech-sdk
```

```javascript
// services/audioGeneration.js

const sdk = require('microsoft-cognitiveservices-speech-sdk')

async function generateDialogueScript(text) {
  // Reutilise le routing existant - tache proche de Fiche, DeepSeek suffit
  const result = await generateWithFallback(text, 'audio_dialogue')
  return result.dialogue  // [{ speaker: 'A', text: '...' }, ...]
}

// Voix distinctes pour chaque locuteur - choisir des voix bien
// differenciees en timbre pour une bonne clarte a l'ecoute
const VOICES = {
  fr: { A: "fr-FR-HenriNeural", B: "fr-FR-DeniseNeural" },
  en: { A: "en-US-GuyNeural", B: "en-US-JennyNeural" },
}

function buildSSML(dialogue, lang = 'fr') {
  const voices = VOICES[lang] || VOICES.fr
  const turns = dialogue.map(turn => {
    const voiceName = voices[turn.speaker] || voices.A
    // Echapper les caracteres speciaux XML dans le texte
    const safeText = turn.text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<voice name="${voiceName}"><mstts:express-as style="chat">${safeText}</mstts:express-as></voice><break time="400ms"/>`
  }).join('\n')

  return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${lang === 'fr' ? 'fr-FR' : 'en-US'}">
  ${turns}
</speak>`
}

async function synthesizeDialogue(dialogue, lang, outputPath) {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  )
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath)
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

  const ssml = buildSSML(dialogue, lang)

  return new Promise((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      result => {
        synthesizer.close()
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(outputPath)
        } else {
          reject(new Error("Echec de la synthese audio dialogue"))
        }
      },
      error => {
        synthesizer.close()
        reject(error)
      }
    )
  })
}

module.exports = { generateDialogueScript, synthesizeDialogue }
```

### 3. Endpoint complet (upload vers S3 existant)

```javascript
// routes/studySessions.js

const { generateDialogueScript, synthesizeDialogue } = require('../services/audioGeneration')
const { uploadToS3 } = require('../services/s3Storage')  // deja existant dans le projet
const path = require('path')
const fs = require('fs')

router.post('/generate/audio', requireAuth, checkGenerationQuota, async (req, res) => {
  const { resourceId } = req.body
  const text = await extractTextFromResource(resourceId)
  const userLang = req.user?.language || 'fr'

  const dialogue = await generateDialogueScript(text)

  const filename = `audio_${req.user.id}_${Date.now()}.mp3`
  const tempPath = path.join(__dirname, '../temp', filename)
  await synthesizeDialogue(dialogue, userLang, tempPath)

  // Reutilise la fonction S3 deja existante pour les medias/ressources
  const audioUrl = await uploadToS3(tempPath, `audio-dialogues/${filename}`)
  fs.unlinkSync(tempPath)  // nettoyer le fichier temporaire local

  await incrementGenerationQuota(req.generationUsage)

  const session = await StudySession.create({
    owner: req.user.id,
    resource: resourceId,
    tool_type: 'audio',
    content: { dialogue, audioUrl },
  })

  res.json({ success: true, data: session })
})
```

### 4. Frontend - lecteur audio avec transcription du dialogue

```typescript
// src/components/study/AudioPlayerView.tsx

interface DialogueTurn {
  speaker: 'A' | 'B'
  text: string
}

const AudioPlayerView = ({
  audioUrl, dialogue, titre
}: { audioUrl: string, dialogue: DialogueTurn[], titre: string }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  return (
    <div className="p-6 bg-[#0f0f0f] rounded-xl border border-[#222]">
      <h3 className="text-lg font-semibold text-white mb-1">{titre}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        🎙️ Dialogue genere par Sphera - style podcast
      </p>

      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => {
            if (isPlaying) audioRef.current?.pause()
            else audioRef.current?.play()
            setIsPlaying(!isPlaying)
          }}
          className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <a href={audioUrl} download className="text-sm text-[#22C55E]">
          ⬇ Telecharger l'audio
        </a>
      </div>

      <details className="text-sm text-gray-400 space-y-2">
        <summary className="cursor-pointer text-[#22C55E] mb-2">
          Voir la transcription du dialogue
        </summary>
        {dialogue.map((turn, i) => (
          <p key={i} className="leading-relaxed">
            <span className={turn.speaker === 'A' ? 'text-[#22C55E] font-medium' : 'text-blue-400 font-medium'}>
              {turn.speaker === 'A' ? 'Etudiant A : ' : 'Etudiant B : '}
            </span>
            {turn.text}
          </p>
        ))}
      </details>
    </div>
  )
}

export default AudioPlayerView
```

---

## Ordre d'implementation

```
1. Cartes mentales - backend (prompt + endpoint + routing) : 1h
2. Cartes mentales - frontend (ReactFlow + composant) : 2h
3. Verifier acces Azure Speech (cle API + region) sur le compte
   Azure for Students deja actif : 15 min
4. Resume audio dialogue - backend (script 2 voix + SSML + synthese
   + upload S3 existant) : 2-3h
5. Resume audio dialogue - frontend (lecteur audio + transcription
   par locuteur) : 1h
6. Ajouter les 2 nouveaux tool_type dans les onglets Sphera existants
   (Fiche/Quiz/Flashcards/Q&A/Annale -> + Carte mentale + Audio) : 30 min
7. Tests sur de vrais cours (francais + anglais), verifier la qualite
   et le naturel du dialogue genere : 1h
```

## Points d'attention

1. Cartes mentales - l'interface est navigable (zoom + deplacement
   libre en 2D, pas de vue 3D/rotation), donc les limites du prompt
   (4 niveaux, 10 branches, 6 sous-branches) sont plus generales que
   pour une vue fixe. Prevoir malgre tout un bouton "Centrer / 
   Reinitialiser la vue" pour revenir facilement au centre apres
   avoir navigue sur un cours tres dense.

2. Resume audio - quota gratuit Azure Speech (500 000 caracteres/mois)
   correspond a environ 95-140 dialogues generables par mois (format
   4-6 min, plus long qu'un monologue simple). Suivre ce quota
   separement du budget Bedrock deja tracke - potentiellement dans
   le meme dashboard admin, sous une section distincte.

3. Langue de la voix - detecter automatiquement si le cours source
   est en francais ou anglais pour choisir le bon jeu de voix
   neuronales Azure (fr-FR vs en-US), sinon utiliser la preference
   de langue du profil utilisateur deja disponible via le contexte
   profil existant.

4. Stockage audio - S3, deja utilise depuis le debut du projet pour
   les medias utilisateurs et les ressources (budget dedie de 22$,
   separe des 90$ Bedrock). Reutiliser la fonction d'upload S3 deja
   existante dans le backend plutot que d'introduire un nouveau
   systeme de stockage - pas de raison de fragmenter l'infra.

5. Qualite du dialogue genere - contrairement a NotebookLM qui genere
   une conversation dynamique, ce systeme produit un script pre-ecrit
   joue par 2 voix. Verifier a l'usage reel que le resultat sonne
   suffisamment naturel - si besoin, iterer sur le prompt
   AUDIO_DIALOGUE_PROMPT pour ameliorer le naturel des transitions
   et des reactions entre les deux locuteurs.

6. SSML et caracteres speciaux - bien echapper le texte genere par
   le LLM avant de l'inserer dans le SSML (voir fonction buildSSML)
   pour eviter des erreurs de synthese si le texte contient des
   caracteres comme &, <, > (rare mais possible selon le contenu
   du cours source).
