# CampusSphere — Module Événements

## Contexte
CampusSphere doit permettre aux étudiants et clubs de créer, découvrir
et rejoindre des événements campus (conférences, hackathons, soirées,
compétitions comme le MathScam, Welcome Ceremony, etc.)

Stack : Backend Node.js + Express + PostgreSQL/Supabase
Frontend : React 18 + TypeScript + Vite + Tailwind + Shadcn/UI

Cas d'usage concret prioritaire : le **Welcome Week** et le **MathScam**
de la rentrée IUC doivent pouvoir être créés comme événements sur CampusSphere.

---

## PARTIE 1 — Backend

### 1. Modèle de données

```javascript
// models/Event.js

const EventCategory = {
  CONFERENCE: 'conference',
  HACKATHON: 'hackathon',
  PARTY: 'party',           // soirées, Welcome Ceremony
  COMPETITION: 'competition', // MathScam et compétitions académiques
  WORKSHOP: 'workshop',
  OTHER: 'other',
}

const EventSchema = {
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: Object.values(EventCategory), required: true },

  organizer: { type: ObjectId, ref: 'User', required: true },
  sphere: { type: ObjectId, ref: 'Sphere' },  // optionnel — lié à une sphère (club, cours)

  startDate: { type: Date, required: true },
  endDate: Date,
  location: String,          // "Amphi B2, IUC Douala" ou lien si en ligne
  isOnline: { type: Boolean, default: false },
  onlineLink: String,

  coverImage: String,        // URL de l'affiche/bannière
  maxAttendees: Number,      // null = illimité

  isPublic: { type: Boolean, default: true },  // visible à tous ou juste sphère liée

  createdAt: { type: Date, default: Date.now },
}

const EventAttendeeSchema = {
  event: { type: ObjectId, ref: 'Event', required: true },
  user: { type: ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['interested', 'going', 'attended'], default: 'interested' },
  registeredAt: { type: Date, default: Date.now },
}
```

### 2. Endpoints CRUD événements

```javascript
// routes/events.js

// GET /api/events — liste des événements (filtrable)
router.get('/', requireAuth, async (req, res) => {
  const { category, upcoming, sphereId } = req.query

  const filter = { isPublic: true }
  if (category) filter.category = category
  if (upcoming === 'true') filter.startDate = { $gte: new Date() }
  if (sphereId) filter.sphere = sphereId

  const events = await Event.find(filter)
    .populate('organizer', 'firstName lastName avatar')
    .sort({ startDate: 1 })

  res.json({ success: true, data: events })
})

// GET /api/events/:id — détails d'un événement
router.get('/:id', requireAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer sphere')
  const attendeesCount = await EventAttendee.countDocuments({ event: event._id, status: 'going' })
  res.json({ success: true, data: { ...event.toObject(), attendeesCount } })
})

// POST /api/events — créer un événement
router.post('/', requireAuth, async (req, res) => {
  const event = await Event.create({ ...req.body, organizer: req.user.id })
  res.json({ success: true, data: event })
})

// PUT /api/events/:id — modifier (organisateur uniquement)
router.put('/:id', requireAuth, async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id })
  if (!event) return res.status(403).json({ success: false, error: "Non autorisé" })

  Object.assign(event, req.body)
  await event.save()
  res.json({ success: true, data: event })
})

// DELETE /api/events/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await Event.deleteOne({ _id: req.params.id, organizer: req.user.id })
  res.json({ success: true })
})

// POST /api/events/:id/register — s'inscrire / marquer intéressé
router.post('/:id/register', requireAuth, async (req, res) => {
  const { status } = req.body  // 'interested' | 'going'

  const existing = await EventAttendee.findOne({ event: req.params.id, user: req.user.id })
  if (existing) {
    existing.status = status
    await existing.save()
  } else {
    await EventAttendee.create({ event: req.params.id, user: req.user.id, status })
  }

  res.json({ success: true })
})

// DELETE /api/events/:id/register — se désinscrire
router.delete('/:id/register', requireAuth, async (req, res) => {
  await EventAttendee.deleteOne({ event: req.params.id, user: req.user.id })
  res.json({ success: true })
})

// GET /api/events/:id/attendees — liste des participants (organisateur)
router.get('/:id/attendees', requireAuth, async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id })
  if (!event) return res.status(403).json({ success: false, error: "Non autorisé" })

  const attendees = await EventAttendee.find({ event: req.params.id })
    .populate('user', 'firstName lastName email university faculty')

  res.json({ success: true, data: attendees })
})

// GET /api/events/mine — mes événements (créés + inscrits)
router.get('/mine', requireAuth, async (req, res) => {
  const created = await Event.find({ organizer: req.user.id })
  const registered = await EventAttendee.find({ user: req.user.id }).populate('event')

  res.json({ success: true, data: { created, registered: registered.map(r => r.event) } })
})
```

### 3. Notifications automatiques

```javascript
// services/eventNotifications.js

// À déclencher via un cron job (node-cron) — rappel 24h avant l'événement
const sendEventReminders = async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const upcomingEvents = await Event.find({
    startDate: {
      $gte: new Date(tomorrow.setHours(0,0,0,0)),
      $lte: new Date(tomorrow.setHours(23,59,59,999)),
    }
  })

  for (const event of upcomingEvents) {
    const attendees = await EventAttendee.find({ event: event._id, status: 'going' })
    await Promise.all(
      attendees.map(a => createNotification({
        user: a.user,
        type: 'event_reminder',
        title: `Demain : ${event.title}`,
        body: `${event.location} — ${new Date(event.startDate).toLocaleTimeString('fr-FR')}`,
        link: `/events/${event._id}`,
      }))
    )
  }
}

// Notification à la création (aux membres de la sphère si liée)
const notifyNewEvent = async (event) => {
  if (!event.sphere) return
  const members = await SphereMember.find({ sphere: event.sphere })
  await Promise.all(
    members.map(m => createNotification({
      user: m.user,
      type: 'new_event',
      title: `Nouvel événement : ${event.title}`,
      body: new Date(event.startDate).toLocaleDateString('fr-FR'),
      link: `/events/${event._id}`,
    }))
  )
}
```

```javascript
// setup cron (server.js ou app.js)
const cron = require('node-cron')
// Tous les jours à 9h du matin
cron.schedule('0 9 * * *', sendEventReminders)
```

---

## PARTIE 2 — Frontend

### 1. Page liste des événements

```typescript
// src/pages/Events.tsx

const Events = () => {
  const [category, setCategory] = useState<string | null>(null)
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', category],
    queryFn: () => getEvents({ category, upcoming: true }),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Événements</h1>
        <Button onClick={() => navigate('/events/create')}>+ Créer un événement</Button>
      </div>

      <CategoryFilters value={category} onChange={setCategory} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events?.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
```

### 2. Composant EventCard

```typescript
// src/components/events/EventCard.tsx

const EventCard = ({ event }: { event: Event }) => {
  const isPast = new Date(event.startDate) < new Date()

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      {event.coverImage && (
        <img src={event.coverImage} className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <Badge>{event.category}</Badge>
        <h3 className="font-semibold mt-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(event.startDate).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </p>
        <p className="text-sm text-muted-foreground">{event.location}</p>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs">{event.attendeesCount} participants</span>
          {!isPast && (
            <Button size="sm" onClick={() => registerToEvent(event.id, 'going')}>
              Je participe
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. Formulaire de création d'événement

```typescript
// src/pages/EventCreate.tsx

const EventCreate = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'conference',
    startDate: '', endDate: '', location: '', isOnline: false,
    coverImage: null, sphereId: null,
  })

  const { mutate: createEvent } = useMutation({
    mutationFn: createEventApi,
    onSuccess: (data) => navigate(`/events/${data.id}`)
  })

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Titre" value={formData.title} onChange={...} />
      <Textarea label="Description" value={formData.description} onChange={...} />
      <Select label="Catégorie" options={EVENT_CATEGORIES} value={formData.category} onChange={...} />
      <DateTimePicker label="Date et heure de début" value={formData.startDate} onChange={...} />
      <Input label="Lieu" value={formData.location} onChange={...} />
      <Checkbox label="Événement en ligne" checked={formData.isOnline} onChange={...} />
      <ImageUpload label="Affiche de l'événement" onChange={...} />
      <SphereSelect label="Lier à une sphère (optionnel)" value={formData.sphereId} onChange={...} />

      <Button type="submit">Créer l'événement</Button>
    </form>
  )
}
```

### 4. Page détail événement

```typescript
// src/pages/EventDetail.tsx

const EventDetail = () => {
  const { id } = useParams()
  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id),
  })

  const { mutate: register } = useMutation({
    mutationFn: (status: string) => registerToEvent(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', id] })
  })

  const isOrganizer = event?.organizer.id === currentUser.id

  return (
    <div>
      {event?.coverImage && <img src={event.coverImage} className="w-full h-64 object-cover rounded-xl" />}
      <h1>{event?.title}</h1>
      <p>{event?.description}</p>

      <div className="flex gap-4 mt-4">
        <Button onClick={() => register('going')}>Je participe</Button>
        <Button variant="outline" onClick={() => register('interested')}>Intéressé</Button>
      </div>

      {isOrganizer && (
        <Link to={`/events/${id}/attendees`}>Voir les {event?.attendeesCount} participants</Link>
      )}
    </div>
  )
}
```

## Ordre d'implémentation

```
1. Modèle Event + EventAttendee (30 min)
2. Endpoints CRUD événements (1-2h)
3. Notifications (création + rappel 24h via cron) (1h)
4. Frontend — page liste + EventCard (1-2h)
5. Frontend — formulaire de création (1-2h)
6. Frontend — page détail + inscription (1h)
7. Bonus — génération description Sphera (1h)
```

## Points d'attention

1. **Cas d'usage Welcome Week** — tester la création d'un événement
   "Welcome Ceremony" avec catégorie `party` et le MathScam avec
   catégorie `competition` avant la rentrée pour valider le flow complet.

2. **Affiches** — prévoir l'upload d'image pour la bannière (Kana s'en
   occupera pour les affiches Welcome Ceremony).

3. **Lien** — l'événement pourra
   éventuellement contenir un lien
