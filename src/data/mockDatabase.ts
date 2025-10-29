// Mock Database Structure - Simulates Real Database
export interface User {
  id: string;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  coverPhoto?: string;
  university: string;
  faculty: string;
  studyLevel: string;
  city: string;
  impactScore: number;
  currentMood: string;
  joinedAt: string;
  isVerified: boolean;
  settings: {
    notifications: boolean;
    privacy: 'public' | 'friends' | 'private';
    language: string;
    theme: 'light' | 'dark';
  };
}

export interface Sphere {
  id: string;
  name: string;
  description: string;
  objective: string;
  creatorId: string;
  category: string;
  color: string;
  isPrivate: boolean;
  requireApproval: boolean;
  memberCount: number;
  fileCount: number;
  impactScore: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SphereMember {
  role: 'Admin' | 'Moderator' | 'Member';
  isCreator: boolean;
  joinedAt: string;
}

export interface PendingRequest {
  userId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SphereFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
}

export interface Task {
  id: string;
  sphereId: string;
  title: string;
  description: string;
  assignedToId?: string;
  assignedById: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  impactPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  visibility: 'public' | 'sphere' | 'friends';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  authorId: string;
  type: string;
  subject: string;
  audience: string;
  visibility: 'public' | 'university' | 'private';
  fileUrl: string;
  fileSize: string;
  tags: string[];
  impactScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  date: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: 'sphere_join_request' | 'task_assigned' | 'post_liked' | 'event_reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  notifications: boolean;
  privacy: 'public' | 'friends' | 'private';
  language: string;
  theme: 'light' | 'dark';
}

// Mock Database
export const mockDatabase = {
  // Current User (pour tester différents scénarios)
  currentUserId: "user_1",

  // Users
  users: {
    "user_1": {
      id: "user_1",
      username: "max_prime",
      name: "Max Prime",
      firstName: "Max",
      lastName: "Prime",
      email: "max.prime@univ-yaounde.cm",
      avatar: "/avatars/max-prime.jpg",
      coverPhoto: "/covers/max-cover.jpg",
      university: "Université de Yaoundé I",
      faculty: "Sciences",
      studyLevel: "Master 2",
      city: "Yaoundé",
      impactScore: 1250,
      currentMood: "Motivé",
      joinedAt: "2024-01-15T10:30:00Z",
      isVerified: true,
      settings: {
        notifications: true,
        privacy: "friends",
        language: "fr",
        theme: "light"
      }
    } as User,
    "user_2": {
      id: "user_2",
      username: "hussein_boris",
      name: "Hussein Boris",
      firstName: "Hussein",
      lastName: "Boris",
      email: "hussein.boris@univ-yaounde.cm",
      avatar: "/avatars/hussein-boris.jpg",
      coverPhoto: "/covers/hussein-cover.jpg",
      university: "Université de Yaoundé I",
      faculty: "Informatique",
      studyLevel: "Licence 3",
      city: "Yaoundé",
      impactScore: 980,
      currentMood: "Concentré",
      joinedAt: "2024-01-12T14:20:00Z",
      isVerified: true,
      settings: {
        notifications: true,
        privacy: "public",
        language: "fr",
        theme: "light"
      }
    } as User,
    "user_3": {
      id: "user_3",
      username: "kana_tommi",
      name: "Kana Tommi",
      firstName: "Kana",
      lastName: "Tommi",
      email: "kana.tommi@univ-douala.cm",
      avatar: "/avatars/kana-tommi.jpg",
      coverPhoto: "/covers/kana-cover.jpg",
      university: "Université de Douala",
      faculty: "Économie",
      studyLevel: "Master 1",
      city: "Douala",
      impactScore: 750,
      currentMood: "Créatif",
      joinedAt: "2024-01-10T09:15:00Z",
      isVerified: false,
      settings: {
        notifications: false,
        privacy: "friends",
        language: "fr",
        theme: "dark"
      }
    } as User,
    "user_4": {
      id: "user_4",
      username: "nounga_nathan",
      name: "Nounga Nathan",
      firstName: "Nounga",
      lastName: "Nathan",
      email: "nounga.nathan@univ-yaounde.cm",
      avatar: "/avatars/nounga-nathan.jpg",
      coverPhoto: "/covers/nounga-cover.jpg",
      university: "Université de Yaoundé I",
      faculty: "Sciences",
      studyLevel: "Doctorat 1",
      city: "Yaoundé",
      impactScore: 1450,
      currentMood: "Inspiré",
      joinedAt: "2024-01-08T16:45:00Z",
      isVerified: true,
      settings: {
        notifications: true,
        privacy: "public",
        language: "fr",
        theme: "light"
      }
    } as User,
    "user_5": {
      id: "user_5",
      username: "roy_darlin",
      name: "Roy Darlin",
      firstName: "Roy",
      lastName: "Darlin",
      email: "roy.darlin@univ-buea.cm",
      avatar: "/avatars/roy-darlin.jpg",
      coverPhoto: "/covers/roy-cover.jpg",
      university: "Université de Buea",
      faculty: "Ingénierie",
      studyLevel: "Licence 2",
      city: "Buea",
      impactScore: 620,
      currentMood: "Déterminé",
      joinedAt: "2024-01-14T11:30:00Z",
      isVerified: false,
      settings: {
        notifications: true,
        privacy: "friends",
        language: "en",
        theme: "light"
      }
    } as User
  },

  // Spheres
  spheres: {
    "sphere_1": {
      id: "sphere_1",
      name: "IA & Machine Learning",
      description: "Sphère dédiée à l'intelligence artificielle et au machine learning",
      objective: "Créer une plateforme intelligente qui aide les étudiants à découvrir des opportunités, ressources et connexions pertinentes sur le campus",
      creatorId: "user_1",
      category: "Technologie",
      color: "#3B82F6",
      isPrivate: false,
      requireApproval: true,
      memberCount: 12,
      fileCount: 3,
      impactScore: 850,
      createdAt: "2024-01-10T08:00:00Z",
      updatedAt: "2024-01-15T14:30:00Z",
      tags: ["IA", "Machine Learning", "Python", "React"]
    } as Sphere,
    "sphere_2": {
      id: "sphere_2",
      name: "Économie & Développement",
      description: "Sphère pour les étudiants en économie et développement",
      objective: "Partager des connaissances économiques et promouvoir le développement durable",
      creatorId: "user_3",
      category: "Économie",
      color: "#10B981",
      isPrivate: false,
      requireApproval: false,
      memberCount: 8,
      fileCount: 5,
      impactScore: 650,
      createdAt: "2024-01-12T10:00:00Z",
      updatedAt: "2024-01-15T09:20:00Z",
      tags: ["Économie", "Développement", "Finance", "Sustainabilité"]
    } as Sphere,
    "sphere_3": {
      id: "sphere_3",
      name: "Recherche Scientifique",
      description: "Sphère pour les chercheurs et doctorants",
      objective: "Collaborer sur des projets de recherche et partager des découvertes",
      creatorId: "user_4",
      category: "Recherche",
      color: "#8B5CF6",
      isPrivate: true,
      requireApproval: true,
      memberCount: 6,
      fileCount: 12,
      impactScore: 1200,
      createdAt: "2024-01-08T14:00:00Z",
      updatedAt: "2024-01-15T16:45:00Z",
      tags: ["Recherche", "Science", "Innovation", "Doctorat"]
    } as Sphere,
    "sphere_4": {
      id: "sphere_4",
      name: "Ingénierie & Innovation",
      description: "Sphère pour les étudiants en ingénierie",
      objective: "Partager des projets d'ingénierie et promouvoir l'innovation",
      creatorId: "user_5",
      category: "Ingénierie",
      color: "#F59E0B",
      isPrivate: false,
      requireApproval: false,
      memberCount: 15,
      fileCount: 8,
      impactScore: 720,
      createdAt: "2024-01-13T11:00:00Z",
      updatedAt: "2024-01-15T13:20:00Z",
      tags: ["Ingénierie", "Innovation", "Projets", "Technologie"]
    } as Sphere
  },

  // Sphere Members
  sphereMembers: {
    "sphere_1": {
      "user_1": { role: "Admin", isCreator: true, joinedAt: "2024-01-10T08:00:00Z" },
      "user_2": { role: "Moderator", isCreator: false, joinedAt: "2024-01-11T09:15:00Z" },
      "user_4": { role: "Member", isCreator: false, joinedAt: "2024-01-12T11:30:00Z" }
    },
    "sphere_2": {
      "user_3": { role: "Admin", isCreator: true, joinedAt: "2024-01-12T10:00:00Z" },
      "user_1": { role: "Member", isCreator: false, joinedAt: "2024-01-13T15:20:00Z" },
      "user_5": { role: "Member", isCreator: false, joinedAt: "2024-01-14T10:45:00Z" }
    },
    "sphere_3": {
      "user_4": { role: "Admin", isCreator: true, joinedAt: "2024-01-08T14:00:00Z" },
      "user_1": { role: "Moderator", isCreator: false, joinedAt: "2024-01-09T16:30:00Z" },
      "user_2": { role: "Member", isCreator: false, joinedAt: "2024-01-10T11:15:00Z" }
    },
    "sphere_4": {
      "user_5": { role: "Admin", isCreator: true, joinedAt: "2024-01-13T11:00:00Z" },
      "user_3": { role: "Member", isCreator: false, joinedAt: "2024-01-14T14:20:00Z" },
      "user_1": { role: "Member", isCreator: false, joinedAt: "2024-01-15T09:30:00Z" }
    }
  },

  // Pending Requests
  pendingRequests: {
    "sphere_1": [
      { userId: "user_5", requestedAt: "2024-01-15T10:30:00Z", status: "pending" },
      { userId: "user_3", requestedAt: "2024-01-14T15:45:00Z", status: "pending" }
    ],
    "sphere_3": [
      { userId: "user_3", requestedAt: "2024-01-13T09:20:00Z", status: "pending" },
      { userId: "user_5", requestedAt: "2024-01-12T14:10:00Z", status: "pending" }
    ]
  },

  // Sphere Files
  sphereFiles: {
    "sphere_1": [
      {
        id: "file_1",
        name: "Introduction au Machine Learning.pdf",
        type: "PDF",
        size: "2.5 MB",
        uploadedBy: "user_1",
        uploadedAt: "2024-01-15T10:30:00Z",
        downloadCount: 15
      } as SphereFile,
      {
        id: "file_2",
        name: "Algorithme de Deep Learning.pptx",
        type: "PowerPoint",
        size: "8.2 MB",
        uploadedBy: "user_2",
        uploadedAt: "2024-01-14T16:20:00Z",
        downloadCount: 8
      } as SphereFile,
      {
        id: "file_3",
        name: "Dataset d'entraînement.zip",
        type: "Archive",
        size: "15.7 MB",
        uploadedBy: "user_4",
        uploadedAt: "2024-01-13T11:45:00Z",
        downloadCount: 12
      } as SphereFile
    ],
    "sphere_2": [
      {
        id: "file_4",
        name: "Économie du Développement.pdf",
        type: "PDF",
        size: "3.1 MB",
        uploadedBy: "user_3",
        uploadedAt: "2024-01-15T14:20:00Z",
        downloadCount: 6
      } as SphereFile,
      {
        id: "file_5",
        name: "Finance Durable.docx",
        type: "Word",
        size: "1.8 MB",
        uploadedBy: "user_1",
        uploadedAt: "2024-01-14T10:15:00Z",
        downloadCount: 4
      } as SphereFile
    ]
  },

  // Tasks
  tasks: {
    "task_1": {
      id: "task_1",
      sphereId: "sphere_1",
      title: "Créer le dataset d'entraînement",
      description: "Collecter et nettoyer les données pour l'entraînement du modèle IA",
      assignedToId: "user_2",
      assignedById: "user_1",
      priority: "high",
      status: "in_progress",
      dueDate: "2024-01-20T23:59:59Z",
      impactPoints: 50,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T14:30:00Z"
    } as Task,
    "task_2": {
      id: "task_2",
      sphereId: "sphere_1",
      title: "Optimiser l'algorithme de recommandation",
      description: "Améliorer les performances de l'algorithme existant",
      assignedToId: "user_4",
      assignedById: "user_1",
      priority: "medium",
      status: "pending",
      dueDate: "2024-01-25T23:59:59Z",
      impactPoints: 30,
      createdAt: "2024-01-15T11:30:00Z",
      updatedAt: "2024-01-15T11:30:00Z"
    } as Task,
    "task_3": {
      id: "task_3",
      sphereId: "sphere_2",
      title: "Analyser les données économiques",
      description: "Analyser les tendances économiques récentes du Cameroun",
      assignedToId: "user_1",
      assignedById: "user_3",
      priority: "high",
      status: "in_progress",
      dueDate: "2024-01-22T23:59:59Z",
      impactPoints: 40,
      createdAt: "2024-01-15T13:00:00Z",
      updatedAt: "2024-01-15T13:00:00Z"
    } as Task
  },

  // Global Posts
  globalPosts: {
    "post_1": {
      id: "post_1",
      authorId: "user_1",
      content: "Nouveau projet d'IA en cours ! Nous travaillons sur un système de recommandation intelligent pour les étudiants. Qui veut participer ?",
      type: "text",
      visibility: "public",
      tags: ["projet", "IA", "recommandation"],
      createdAt: "2024-01-15T14:30:00Z",
      updatedAt: "2024-01-15T14:30:00Z",
      stats: { likes: 5, comments: 2, shares: 1 }
    } as Post,
    "post_2": {
      id: "post_2",
      authorId: "user_3",
      content: "Conférence sur l'économie verte demain à 14h. Qui est intéressé ?",
      type: "text",
      visibility: "public",
      tags: ["conférence", "économie verte"],
      createdAt: "2024-01-15T12:15:00Z",
      updatedAt: "2024-01-15T12:15:00Z",
      stats: { likes: 3, comments: 1, shares: 0 }
    } as Post,
    "post_3": {
      id: "post_3",
      authorId: "user_4",
      content: "Résultats de notre recherche sur les énergies renouvelables publiés ! 🎉",
      type: "text",
      visibility: "public",
      tags: ["recherche", "énergies renouvelables", "publication"],
      createdAt: "2024-01-15T16:45:00Z",
      updatedAt: "2024-01-15T16:45:00Z",
      stats: { likes: 8, comments: 4, shares: 2 }
    } as Post
  },

  // Global Resources
  globalResources: {
    "resource_1": {
      id: "resource_1",
      title: "Introduction au Machine Learning",
      description: "Cours complet sur les bases du machine learning avec Python",
      authorId: "user_1",
      type: "PDF",
      subject: "Informatique",
      audience: "Master 1",
      visibility: "university",
      fileUrl: "/resources/ml-intro.pdf",
      fileSize: "2.5 MB",
      tags: ["Machine Learning", "Python", "IA"],
      impactScore: 85,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    } as Resource,
    "resource_2": {
      id: "resource_2",
      title: "Économie du Développement",
      description: "Notes de cours sur l'économie du développement durable",
      authorId: "user_3",
      type: "PDF",
      subject: "Économie",
      audience: "Licence 3",
      visibility: "university",
      fileUrl: "/resources/economie-dev.pdf",
      fileSize: "1.8 MB",
      tags: ["Économie", "Développement", "Sustainabilité"],
      impactScore: 72,
      createdAt: "2024-01-15T14:20:00Z",
      updatedAt: "2024-01-15T14:20:00Z"
    } as Resource
  },

  // Events
  events: {
    "event_1": {
      id: "event_1",
      title: "Conférence sur l'Intelligence Artificielle",
      description: "Conférence sur les dernières avancées en IA et leur impact sur l'éducation",
      organizerId: "user_1",
      date: "2024-01-25T14:00:00Z",
      location: "Amphithéâtre 100, Université de Yaoundé I",
      maxParticipants: 50,
      currentParticipants: 12,
      isPublic: true,
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T09:00:00Z"
    } as Event,
    "event_2": {
      id: "event_2",
      title: "Séminaire Économie Verte",
      description: "Séminaire sur les pratiques économiques durables",
      organizerId: "user_3",
      date: "2024-01-28T10:00:00Z",
      location: "Salle de conférence, Université de Douala",
      maxParticipants: 30,
      currentParticipants: 8,
      isPublic: true,
      createdAt: "2024-01-15T11:30:00Z",
      updatedAt: "2024-01-15T11:30:00Z"
    } as Event
  },

  // Conversations
  conversations: {
    "conv_1": {
      id: "conv_1",
      type: "private",
      participants: ["user_1", "user_2"],
      lastMessage: "Salut, comment ça va ?",
      lastMessageAt: "2024-01-15T16:30:00Z",
      messages: [
        {
          id: "msg_1",
          senderId: "user_1",
          content: "Salut, comment ça va ?",
          sentAt: "2024-01-15T16:30:00Z"
        }
      ]
    } as Conversation,
    "conv_2": {
      id: "conv_2",
      type: "group",
      participants: ["user_1", "user_3", "user_4"],
      lastMessage: "On se voit demain pour le projet ?",
      lastMessageAt: "2024-01-15T17:00:00Z",
      messages: [
        {
          id: "msg_2",
          senderId: "user_1",
          content: "On se voit demain pour le projet ?",
          sentAt: "2024-01-15T17:00:00Z"
        }
      ]
    } as Conversation
  },

  // Notifications
  notifications: {
    "user_1": [
      {
        id: "notif_1",
        type: "sphere_join_request",
        title: "Nouvelle demande d'adhésion",
        message: "Roy Darlin souhaite rejoindre IA & Machine Learning",
        read: false,
        createdAt: "2024-01-15T15:00:00Z"
      } as Notification,
      {
        id: "notif_2",
        type: "task_assigned",
        title: "Nouvelle tâche assignée",
        message: "Vous avez été assigné à la tâche 'Analyser les données économiques'",
        read: true,
        createdAt: "2024-01-15T13:00:00Z"
      } as Notification
    ],
    "user_5": [
      {
        id: "notif_3",
        type: "sphere_join_request",
        title: "Demande en attente",
        message: "Votre demande d'adhésion à IA & Machine Learning est en cours d'examen",
        read: false,
        createdAt: "2024-01-15T10:30:00Z"
      } as Notification
    ]
  },

  // User Settings
  userSettings: {
    "user_1": {
      notifications: true,
      privacy: "friends",
      language: "fr",
      theme: "light"
    } as UserSettings,
    "user_2": {
      notifications: true,
      privacy: "public",
      language: "fr",
      theme: "light"
    } as UserSettings,
    "user_3": {
      notifications: false,
      privacy: "friends",
      language: "fr",
      theme: "dark"
    } as UserSettings,
    "user_4": {
      notifications: true,
      privacy: "public",
      language: "fr",
      theme: "light"
    } as UserSettings,
    "user_5": {
      notifications: true,
      privacy: "friends",
      language: "en",
      theme: "light"
    } as UserSettings
  }
};
