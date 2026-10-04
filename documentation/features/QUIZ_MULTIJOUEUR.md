# Sphera — Quiz Multijoueur V1 (pour le MathScam)

## Contexte
Cas d'usage concret et daté : le MathScam, competition mathematique
du Welcome Week IUC, ou les 1eres annees s'affrontent en quiz rapide.
Objectif : integrer ce cas d'usage dans Sphera comme feature de
quiz multijoueur en temps reel - un Kahoot integre a CampusSphere.

Nom produit de cette feature : **Sphera Live** — sous-marque de Sphera
dediee au temps reel / social, separee des outils individuels existants
(Fiche, Quiz solo, Flashcards, Q&A, Annales).

### Les 3 sources de questions (important)

La logique de session (rejoindre, timer, scoring, leaderboard) est
**identique** peu importe d'ou viennent les questions. Seule la maniere
de peupler `session.questions` change :

```
Source 1 — Generation IA (reutilise l'existant)
  Depuis un cours/PDF via generate_with_fallback(text, 'quiz')
  → le systeme Claude/Gemini/Groq deja en place pour le Quiz solo

Source 2 — Creation manuelle
  L'organisateur tape ses questions/reponses/options a la main
  dans un formulaire (utile pour le MathScam avec ses propres questions)

Source 3 — Import JSON
  L'organisateur uploade un fichier JSON respectant un schema fixe
  (utile pour reutiliser un quiz existant, migrer depuis un autre outil,
  ou preparer des questions a l'avance hors-ligne)
```

Les 3 sources produisent le **meme format de sortie** avant d'etre
enregistrees dans `QuizSession.questions` — donc le reste du systeme
(WebSocket, scoring, leaderboard) ne sait jamais d'ou viennent les
questions et n'a pas besoin de le savoir.

Stack : Backend Node.js + Express + WebSockets (Socket.io recommande)
Frontend : React 18 + TypeScript + Vite + Tailwind

V1 volontairement simple - pas de sur-ingenierie. Objectif : que ca
marche pour le Welcome Week, pas de construire un Kahoot complet.

---

## Concept V1

```
Un organisateur cree une session
        v
Genere un code de salle a 6 chiffres (ex: 482913)
        v
Les participants rejoignent en entrant le code
        v
L'organisateur lance le quiz
        v
Question affichee simultanement a tous, timer 15-20s
        v
Chaque participant repond depuis son telephone
        v
Classement affiche apres chaque question (leaderboard live)
        v
Classement final a la fin
```

---

## PARTIE 1 - Backend (WebSockets)

### 1. Installation

```bash
npm install socket.io
```

### 2. Modele de donnees

```javascript
// models/QuizSession.js

const QuizSessionSchema = {
  roomCode: { type: String, unique: true, required: true },
  host: { type: ObjectId, ref: 'User', required: true },
  title: String,
  questions: [{
    question: String,
    options: [String],
    correctIndex: Number,
    timeLimit: { type: Number, default: 15 },
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'question_active', 'question_results', 'finished'],
    default: 'waiting',
  },
  currentQuestionIndex: { type: Number, default: -1 },
  createdAt: { type: Date, default: Date.now },
}

const QuizParticipantSchema = {
  session: { type: ObjectId, ref: 'QuizSession', required: true },
  user: { type: ObjectId, ref: 'User' },
  displayName: String,
  score: { type: Number, default: 0 },
  answers: [{
    questionIndex: Number,
    selectedIndex: Number,
    isCorrect: Boolean,
    timeToAnswer: Number,
  }],
}
```

### 3. Schema commun des questions (peu importe la source)

```javascript
// Format que les 3 sources doivent produire avant creation de session

const QuestionShape = {
  question: String,        // "Quelle est la capitale du Cameroun ?"
  options: [String],       // exactement 4 options
  correctIndex: Number,    // 0-3
  timeLimit: Number,       // secondes, defaut 15
}

// Validation partagee - appelee par les 3 endpoints de creation
function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Le quiz doit contenir au moins une question")
  }
  for (const q of questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error("Chaque question doit avoir un enonce et exactement 4 options")
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      throw new Error("correctIndex invalide")
    }
    q.timeLimit = q.timeLimit || 15
  }
  return questions
}
```

### 4. Endpoints REST - creation de session (3 sources)

```javascript
// routes/quizSessions.js

const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString()

async function createSessionWithQuestions(hostId, title, questions) {
  const validated = validateQuestions(questions)

  let roomCode
  let exists = true
  while (exists) {
    roomCode = generateRoomCode()
    exists = await QuizSession.findOne({ roomCode, status: { $ne: 'finished' } })
  }

  return QuizSession.create({
    roomCode, host: hostId, title, questions: validated, status: 'waiting'
  })
}

// Source 1 — Generation IA depuis une ressource/cours
// Reutilise generate_with_fallback existant (meme moteur que le Quiz solo)
router.post('/generate-and-create', requireAuth, async (req, res) => {
  const { resourceId, title } = req.body
  const text = await extractTextFromResource(resourceId)
  const quizData = await generateWithFallback(text, 'quiz')

  const session = await createSessionWithQuestions(req.user.id, title, quizData.questions)
  res.json({ success: true, data: session })
})

// Source 2 — Creation manuelle
// L'organisateur envoie directement ses questions depuis un formulaire
router.post('/create-manual', requireAuth, async (req, res) => {
  const { title, questions } = req.body
  const session = await createSessionWithQuestions(req.user.id, title, questions)
  res.json({ success: true, data: session })
})

// Source 3 — Import JSON
// L'organisateur uploade un fichier .json respectant QuestionShape
router.post('/import-json', requireAuth, upload.single('file'), async (req, res) => {
  const { title } = req.body
  let parsed
  try {
    parsed = JSON.parse(req.file.buffer.toString('utf-8'))
  } catch (e) {
    return res.status(400).json({ success: false, error: "JSON invalide" })
  }

  // Le JSON attendu : { "questions": [ { question, options, correctIndex, timeLimit } ] }
  try {
    const session = await createSessionWithQuestions(req.user.id, title, parsed.questions)
    res.json({ success: true, data: session })
  } catch (e) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.get('/:roomCode', async (req, res) => {
  const session = await QuizSession.findOne({ roomCode: req.params.roomCode })
  if (!session) return res.status(404).json({ success: false, error: "Salle introuvable" })
  res.json({ success: true, data: { title: session.title, status: session.status } })
})
```

### 5. Exemple de fichier JSON attendu (a documenter pour les organisateurs)

```json
{
  "title": "MathScam 2026 - Premiere Annee",
  "questions": [
    {
      "question": "Quelle est la derivee de x^2 ?",
      "options": ["x", "2x", "x^2", "2x^2"],
      "correctIndex": 1,
      "timeLimit": 15
    },
    {
      "question": "Combien vaut Pi (arrondi a 2 decimales) ?",
      "options": ["3.12", "3.14", "3.16", "3.18"],
      "correctIndex": 1,
      "timeLimit": 10
    }
  ]
}
```

### 4. Logique WebSocket - le coeur du temps reel

```javascript
// socket/quizSocket.js

const setupQuizSocket = (io) => {
  io.on('connection', (socket) => {

    socket.on('join_room', async ({ roomCode, displayName, userId }) => {
      const session = await QuizSession.findOne({ roomCode })
      if (!session || session.status === 'finished') {
        return socket.emit('error', { message: "Salle introuvable ou terminee" })
      }

      socket.join(roomCode)
      socket.data.roomCode = roomCode

      const participant = await QuizParticipant.create({
        session: session._id, user: userId || null, displayName, score: 0
      })
      socket.data.participantId = participant._id

      const participants = await QuizParticipant.find({ session: session._id })
      io.to(roomCode).emit('participants_update', { participants })
    })

    socket.on('start_quiz', async ({ roomCode }) => {
      const session = await QuizSession.findOne({ roomCode })
      session.status = 'active'
      session.currentQuestionIndex = 0
      await session.save()
      sendNextQuestion(io, roomCode, session)
    })

    socket.on('submit_answer', async ({ roomCode, questionIndex, selectedIndex, timeToAnswer }) => {
      const session = await QuizSession.findOne({ roomCode })
      const question = session.questions[questionIndex]
      const isCorrect = selectedIndex === question.correctIndex

      const participant = await QuizParticipant.findById(socket.data.participantId)

      let points = 0
      if (isCorrect) {
        const speedBonus = Math.max(0, 500 - timeToAnswer / 10)
        points = 1000 + Math.floor(speedBonus)
      }

      participant.score += points
      participant.answers.push({ questionIndex, selectedIndex, isCorrect, timeToAnswer })
      await participant.save()

      socket.emit('answer_result', { isCorrect, points, correctIndex: question.correctIndex })
    })

    socket.on('next_question', async ({ roomCode }) => {
      const session = await QuizSession.findOne({ roomCode })
      session.currentQuestionIndex += 1

      if (session.currentQuestionIndex >= session.questions.length) {
        session.status = 'finished'
        await session.save()
        const finalLeaderboard = await QuizParticipant.find({ session: session._id }).sort({ score: -1 })
        io.to(roomCode).emit('quiz_finished', { leaderboard: finalLeaderboard })
      } else {
        await session.save()
        sendNextQuestion(io, roomCode, session)
      }
    })

    socket.on('disconnect', () => {
      // Optionnel : gerer la deconnexion d'un participant
    })
  })

  const sendNextQuestion = (io, roomCode, session) => {
    const question = session.questions[session.currentQuestionIndex]

    io.to(roomCode).emit('new_question', {
      questionIndex: session.currentQuestionIndex,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit,
      totalQuestions: session.questions.length,
    })

    setTimeout(async () => {
      const leaderboard = await QuizParticipant.find({ session: session._id })
        .sort({ score: -1 })
        .limit(10)

      io.to(roomCode).emit('question_results', {
        correctIndex: question.correctIndex,
        leaderboard,
      })
    }, question.timeLimit * 1000)
  }
}

module.exports = { setupQuizSocket }
```

### 5. Setup serveur

```javascript
// server.js - integration Socket.io

const { createServer } = require('http')
const { Server } = require('socket.io')
const { setupQuizSocket } = require('./socket/quizSocket')

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] }
})

setupQuizSocket(io)

httpServer.listen(PORT, () => console.log(`Server + WebSocket running on ${PORT}`))
```

---

## PARTIE 2 - Frontend

### 1. Installation

```bash
npm install socket.io-client
```

### 2. Hook Socket reutilisable

```typescript
// src/hooks/useQuizSocket.ts

import { io, Socket } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'

export const useQuizSocket = (roomCode: string) => {
  const socketRef = useRef<Socket | null>(null)
  const [participants, setParticipants] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [results, setResults] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [status, setStatus] = useState<'waiting' | 'active' | 'finished'>('waiting')

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL)
    socketRef.current = socket

    socket.on('participants_update', ({ participants }) => setParticipants(participants))
    socket.on('new_question', (data) => { setCurrentQuestion(data); setResults(null) })
    socket.on('question_results', (data) => { setResults(data); setLeaderboard(data.leaderboard) })
    socket.on('quiz_finished', (data) => { setStatus('finished'); setLeaderboard(data.leaderboard) })

    return () => { socket.disconnect() }
  }, [])

  const joinRoom = (displayName: string, userId?: string) => {
    socketRef.current?.emit('join_room', { roomCode, displayName, userId })
  }
  const startQuiz = () => socketRef.current?.emit('start_quiz', { roomCode })
  const submitAnswer = (questionIndex: number, selectedIndex: number, timeToAnswer: number) => {
    socketRef.current?.emit('submit_answer', { roomCode, questionIndex, selectedIndex, timeToAnswer })
  }
  const nextQuestion = () => socketRef.current?.emit('next_question', { roomCode })

  return { participants, currentQuestion, results, leaderboard, status, joinRoom, startQuiz, submitAnswer, nextQuestion }
}
```

### 3. Page Host - creer et gerer une session

```typescript
// src/pages/quiz/QuizHost.tsx

const QuizHost = () => {
  const [session, setSession] = useState(null)
  const { participants, currentQuestion, results, startQuiz, nextQuestion } = useQuizSocket(session?.roomCode)

  if (!session) return <QuizSetupForm onSessionCreated={setSession} />

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">Code : {session.roomCode}</h1>
      <p>{participants.length} participants connectes</p>

      {!currentQuestion && <Button size="lg" onClick={startQuiz}>Demarrer le quiz</Button>}
      {currentQuestion && !results && <QuestionDisplay question={currentQuestion} isHost />}
      {results && (
        <div>
          <Leaderboard entries={results.leaderboard} />
          <Button onClick={nextQuestion}>Question suivante</Button>
        </div>
      )}
    </div>
  )
}
```

### 3bis. QuizSetupForm - les 3 sources de questions

```typescript
// src/components/quiz/QuizSetupForm.tsx

type QuestionSource = 'sphera' | 'manual' | 'json'

const QuizSetupForm = ({ onSessionCreated }) => {
  const [source, setSource] = useState<QuestionSource>('sphera')
  const [title, setTitle] = useState('')

  return (
    <div>
      <Input placeholder="Titre du quiz" value={title} onChange={(e) => setTitle(e.target.value)} />

      {/* Choix de la source */}
      <div className="flex gap-2 my-4">
        <SourceTab active={source === 'sphera'} onClick={() => setSource('sphera')}>
          ✨ Générer avec Sphera
        </SourceTab>
        <SourceTab active={source === 'manual'} onClick={() => setSource('manual')}>
          ✏️ Créer manuellement
        </SourceTab>
        <SourceTab active={source === 'json'} onClick={() => setSource('json')}>
          📁 Importer un JSON
        </SourceTab>
      </div>

      {source === 'sphera' && <SpheraGenerateTab title={title} onSessionCreated={onSessionCreated} />}
      {source === 'manual' && <ManualQuestionsTab title={title} onSessionCreated={onSessionCreated} />}
      {source === 'json' && <ImportJsonTab title={title} onSessionCreated={onSessionCreated} />}
    </div>
  )
}

// Source 1 — Génération Sphera (réutilise le sélecteur de ressource existant)
const SpheraGenerateTab = ({ title, onSessionCreated }) => {
  const [resourceId, setResourceId] = useState(null)

  const handleGenerate = async () => {
    const session = await generateAndCreateQuizSession({ resourceId, title })
    onSessionCreated(session)
  }

  return (
    <div>
      <ResourcePicker onSelect={setResourceId} />
      <Button onClick={handleGenerate} disabled={!resourceId || !title}>
        Générer et créer la session
      </Button>
    </div>
  )
}

// Source 2 — Création manuelle
const ManualQuestionsTab = ({ title, onSessionCreated }) => {
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 15 }
  ])

  const addQuestion = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 15 }])

  const handleCreate = async () => {
    const session = await createManualQuizSession({ title, questions })
    onSessionCreated(session)
  }

  return (
    <div>
      {questions.map((q, i) => (
        <QuestionEditor key={i} question={q} onChange={(updated) => {
          const copy = [...questions]; copy[i] = updated; setQuestions(copy)
        }} />
      ))}
      <Button variant="outline" onClick={addQuestion}>+ Ajouter une question</Button>
      <Button onClick={handleCreate} disabled={!title}>Créer la session</Button>
    </div>
  )
}

// Source 3 — Import JSON
const ImportJsonTab = ({ title, onSessionCreated }) => {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const handleImport = async () => {
    try {
      const session = await importJsonQuizSession({ title, file })
      onSessionCreated(session)
    } catch (e) {
      setError("Le fichier JSON n'est pas valide. Vérifie le format attendu.")
    }
  }

  return (
    <div>
      <input type="file" accept=".json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <p className="text-xs text-muted-foreground">
        Format attendu : {"{ questions: [{ question, options[4], correctIndex, timeLimit }] }"}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleImport} disabled={!file || !title}>Importer et créer la session</Button>
    </div>
  )
}
```

### 4. Page Participant - rejoindre et jouer

```typescript
// src/pages/quiz/QuizJoin.tsx

const QuizJoin = () => {
  const [roomCode, setRoomCode] = useState('')
  const [joined, setJoined] = useState(false)
  const { currentQuestion, results, joinRoom, submitAnswer } = useQuizSocket(roomCode)

  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerStartTime, setAnswerStartTime] = useState(null)

  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null)
      setAnswerStartTime(Date.now())
    }
  }, [currentQuestion])

  const handleAnswer = (index) => {
    setSelectedAnswer(index)
    const timeToAnswer = Date.now() - answerStartTime
    submitAnswer(currentQuestion.questionIndex, index, timeToAnswer)
  }

  if (!joined) {
    return (
      <div>
        <Input placeholder="Code a 6 chiffres" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
        <Button onClick={() => { joinRoom(user.firstName); setJoined(true) }}>Rejoindre</Button>
      </div>
    )
  }

  return (
    <div>
      {currentQuestion && !results && (
        <div>
          <TimerBar duration={currentQuestion.timeLimit} />
          <h2>{currentQuestion.question}</h2>
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswer(i)}
                className={`p-4 rounded-xl border-2 ${selectedAnswer === i ? 'border-[#22C55E] bg-[#22C55E]/10' : 'border-border'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      {results && <Leaderboard entries={results.leaderboard} highlightUser={user.id} />}
    </div>
  )
}
```

### 5. Composant Leaderboard

```typescript
// src/components/quiz/Leaderboard.tsx

const Leaderboard = ({ entries, highlightUser }) => {
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg ${entry.user === highlightUser ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-card'}`}>
          <div className="flex items-center gap-3">
            <span className="font-bold w-6">{i + 1}</span>
            <span>{entry.displayName}</span>
          </div>
          <span className="font-bold text-[#22C55E]">{entry.score} pts</span>
        </div>
      ))}
    </div>
  )
}
```

---

## Ordre d'implementation

```
1. Setup Socket.io backend + modeles (1h)
2. Logique WebSocket join/start/answer/next (2-3h)
3. Endpoint generation quiz depuis Sphera (30 min - reutilise l'existant)
4. Frontend hook useQuizSocket (1h)
5. Page Host + QuestionDisplay (2h)
6. Page Participant + reponse + timer (2h)
7. Leaderboard + ecran final (1h)
8. Test complet avec plusieurs appareils/onglets simulant des participants
```

## Points d'attention

1. Mode invite sans compte - pour le MathScam, certains participants
   n'auront peut-etre pas de compte CampusSphere. Prevoir displayName
   sans userId obligatoire.

2. Test de charge leger - tester avec au moins 20-30 connexions
   simulees avant le vrai jour du MathScam pour verifier la stabilite
   du serveur Node.js (Azure B2s devrait tenir sans probleme pour ce volume).

3. Fallback si perte de connexion - un participant qui perd sa
   connexion doit pouvoir rejoindre a nouveau avec le meme roomCode
   sans perdre son score (ameliorer en V2 si le temps manque).

4. Generation questions Sphera - reutiliser directement le systeme
   de fallback IA existant (Claude vers Gemini vers Groq) deja en place
   pour la generation de quiz classique. Pas de nouveau systeme a construire.

---

## PARTIE 3 - Integration UI dans Sphera (navigation + design)

Interface reelle observee sur sphera.campussphere.app/dashboard :
```
Sidebar :
  [+ Generer une session]   <- existant, bouton vert plein
  RECENTS
    (liste des sessions)

Zone principale :
  "Salut {prenom}, pret a reviser ?"
  Zone upload document

Onglets bas de page :
  [Mes révisions] [Mes annales]
```

### Ou placer Sphera Live

**Sidebar** - ajouter un second bouton distinct sous "Generer une session" :
```
[+ Generer une session]     <- existant, vert plein
[zap Sphera Live]           <- nouveau, style outline, pulse anime
```
Point d'entree accessible depuis n'importe quel ecran de Sphera.

**Onglets** - ajouter un 3eme onglet a cote des 2 existants :
```
[Mes révisions] [Mes annales] [zap Sphera Live]
```
Meme pattern de navigation que l'existant (sessions individuelles vs
annales vs live) - coherent avec ce qui existe deja, pas un nouveau
paradigme de navigation.

Le clic sur "Sphera Live" (sidebar ou onglet) ouvre un choix simple :
```
+-----------------------------+
|  zap Sphera Live             |
|                              |
|  [Creer une session]        |
|  [Rejoindre avec un code]   |
+-----------------------------+
```

### Design - identite "energique" (par-dessus l'identite Sphera existante)

Ce qui reste identique a Sphera : vert malachite #22C55E, typographie
Syne + DM Sans, composants Shadcn/UI, dark mode.

Ce qui differencie Sphera Live :

**1. Bouton Sphera Live (sidebar + onglet) - pulse subtil**
```css
.sphera-live-btn {
  animation: pulse-glow 2s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
}
```

**2. Code de salle - grand, bold, effet arcade**
Affiche en tres grand format, espace, avec un leger glow vert -
inspire d'un ecran de retransmission, pas d'un document academique.

**3. Timer visuel avec urgence croissante**
Barre de progression qui se vide, couleur qui shift du vert vers
orange/rouge dans les 3 dernieres secondes.

**4. Feedback immediat sur les reponses**
```
Reponse correcte   -> flash vert + "+1250 pts"
Reponse incorrecte -> flash rouge doux + affiche la bonne reponse
```

**5. Leaderboard anime**
Transition slide up/down quand les positions changent entre deux
questions - pas un simple re-render statique.

### Brief resume pour Nathan (design)

"Sphera Live c'est Sphera qui met un maillot de sport. Meme personne,
meme identite, mais l'energie du mode competition doit se sentir dans
le mouvement - pulse, transitions rapides, feedback immediat. Le reste
de Sphera reste calme et pose parce que c'est pour reviser sereinement ;
Sphera Live doit donner envie de gagner."
