import { mockDatabase, User, Sphere, Task, Post, Resource, Event, Notification, Conversation, SphereFile } from '@/data/mockDatabase';

// Service pour gérer le mock database
export class MockDatabaseService {
  private static instance: MockDatabaseService;
  
  public static getInstance(): MockDatabaseService {
    if (!MockDatabaseService.instance) {
      MockDatabaseService.instance = new MockDatabaseService();
    }
    return MockDatabaseService.instance;
  }

  // ===== GESTION DE L'UTILISATEUR ACTUEL =====
  
  // Changer l'utilisateur actuel
  setCurrentUser(userId: string): void {
    mockDatabase.currentUserId = userId;
    localStorage.setItem('currentUserId', userId);
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    const currentUserId = mockDatabase.currentUserId;
    return mockDatabase.users[currentUserId] || null;
  }

  // Obtenir l'ID de l'utilisateur actuel
  getCurrentUserId(): string {
    return mockDatabase.currentUserId;
  }

  // Charger l'utilisateur actuel depuis localStorage
  loadCurrentUser(): void {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId && mockDatabase.users[savedUserId]) {
      mockDatabase.currentUserId = savedUserId;
    }
  }

  // ===== OPÉRATIONS UTILISATEURS =====

  getUser(userId: string): User | null {
    return mockDatabase.users[userId] || null;
  }

  getAllUsers(): User[] {
    return Object.values(mockDatabase.users);
  }

  updateUser(userId: string, updates: Partial<User>): void {
    if (mockDatabase.users[userId]) {
      mockDatabase.users[userId] = { ...mockDatabase.users[userId], ...updates };
    }
  }

  // ===== OPÉRATIONS SPHÈRES =====

  getSphere(sphereId: string): Sphere | null {
    return mockDatabase.spheres[sphereId] || null;
  }

  getAllSpheres(): Sphere[] {
    return Object.values(mockDatabase.spheres);
  }

  getSpheresByUser(userId: string): Sphere[] {
    return Object.values(mockDatabase.spheres).filter(sphere => sphere.creatorId === userId);
  }

  // ===== GESTION DES MEMBRES DE SPHÈRE =====

  getSphereMembers(sphereId: string): Array<User & { role: string; isCreator: boolean; joinedAt: string }> {
    const members = mockDatabase.sphereMembers[sphereId] || {};
    return Object.entries(members).map(([userId, memberData]) => ({
      ...mockDatabase.users[userId],
      ...memberData
    }));
  }

  getPendingRequests(sphereId: string): Array<User & { requestedAt: string; status: string }> {
    const requests = mockDatabase.pendingRequests[sphereId] || [];
    return requests.map(request => ({
      ...mockDatabase.users[request.userId],
      ...request
    }));
  }

  // Rejoindre une sphère
  joinSphere(sphereId: string, userId: string): boolean {
    const sphere = mockDatabase.spheres[sphereId];
    if (!sphere) return false;

    if (sphere.requireApproval) {
      // Ajouter à la liste des demandes en attente
      if (!mockDatabase.pendingRequests[sphereId]) {
        mockDatabase.pendingRequests[sphereId] = [];
      }
      
      const existingRequest = mockDatabase.pendingRequests[sphereId].find(
        req => req.userId === userId
      );
      
      if (!existingRequest) {
        mockDatabase.pendingRequests[sphereId].push({
          userId,
          requestedAt: new Date().toISOString(),
          status: 'pending'
        });
      }
    } else {
      // Rejoindre directement
      if (!mockDatabase.sphereMembers[sphereId]) {
        mockDatabase.sphereMembers[sphereId] = {};
      }
      
      mockDatabase.sphereMembers[sphereId][userId] = {
        role: 'Member',
        isCreator: false,
        joinedAt: new Date().toISOString()
      };
      
      // Mettre à jour le nombre de membres
      mockDatabase.spheres[sphereId].memberCount++;
    }
    
    return true;
  }

  // Annuler une demande d'adhésion
  cancelJoinRequest(sphereId: string, userId: string): boolean {
    if (mockDatabase.pendingRequests[sphereId]) {
      mockDatabase.pendingRequests[sphereId] = mockDatabase.pendingRequests[sphereId].filter(
        req => req.userId !== userId
      );
      return true;
    }
    return false;
  }

  // Approuver une demande d'adhésion
  approveJoinRequest(sphereId: string, userId: string): boolean {
    if (mockDatabase.pendingRequests[sphereId]) {
      const requestIndex = mockDatabase.pendingRequests[sphereId].findIndex(
        req => req.userId === userId
      );
      
      if (requestIndex !== -1) {
        // Supprimer de la liste des demandes
        mockDatabase.pendingRequests[sphereId].splice(requestIndex, 1);
        
        // Ajouter comme membre
        if (!mockDatabase.sphereMembers[sphereId]) {
          mockDatabase.sphereMembers[sphereId] = {};
        }
        
        mockDatabase.sphereMembers[sphereId][userId] = {
          role: 'Member',
          isCreator: false,
          joinedAt: new Date().toISOString()
        };
        
        // Mettre à jour le nombre de membres
        mockDatabase.spheres[sphereId].memberCount++;
        
        return true;
      }
    }
    return false;
  }

  // Rejeter une demande d'adhésion
  rejectJoinRequest(sphereId: string, userId: string): boolean {
    if (mockDatabase.pendingRequests[sphereId]) {
      mockDatabase.pendingRequests[sphereId] = mockDatabase.pendingRequests[sphereId].filter(
        req => req.userId !== userId
      );
      return true;
    }
    return false;
  }

  // ===== OPÉRATIONS FICHIERS DE SPHÈRE =====

  getSphereFiles(sphereId: string): SphereFile[] {
    return mockDatabase.sphereFiles[sphereId] || [];
  }

  // ===== OPÉRATIONS TÂCHES =====

  getTasksBySphere(sphereId: string): Task[] {
    return Object.values(mockDatabase.tasks).filter(task => task.sphereId === sphereId);
  }

  getTasksByUser(userId: string): Task[] {
    return Object.values(mockDatabase.tasks).filter(task => task.assignedToId === userId);
  }

  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockDatabase.tasks[newTask.id] = newTask;
    return newTask;
  }

  updateTask(taskId: string, updates: Partial<Task>): boolean {
    if (mockDatabase.tasks[taskId]) {
      mockDatabase.tasks[taskId] = {
        ...mockDatabase.tasks[taskId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  // ===== OPÉRATIONS POSTS =====

  getGlobalPosts(): Post[] {
    return Object.values(mockDatabase.globalPosts);
  }

  getPostsByUser(userId: string): Post[] {
    return Object.values(mockDatabase.globalPosts).filter(post => post.authorId === userId);
  }

  // ===== OPÉRATIONS RESSOURCES =====

  getGlobalResources(): Resource[] {
    return Object.values(mockDatabase.globalResources);
  }

  getResourcesByUser(userId: string): Resource[] {
    return Object.values(mockDatabase.globalResources).filter(resource => resource.authorId === userId);
  }

  // ===== OPÉRATIONS ÉVÉNEMENTS =====

  getAllEvents(): Event[] {
    return Object.values(mockDatabase.events);
  }

  getEventsByUser(userId: string): Event[] {
    return Object.values(mockDatabase.events).filter(event => event.organizerId === userId);
  }

  // ===== OPÉRATIONS CONVERSATIONS =====

  getConversationsByUser(userId: string): Conversation[] {
    return Object.values(mockDatabase.conversations).filter(conv => 
      conv.participants.includes(userId)
    );
  }

  // ===== OPÉRATIONS NOTIFICATIONS =====

  getNotificationsByUser(userId: string): Notification[] {
    return mockDatabase.notifications[userId] || [];
  }

  markNotificationAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = mockDatabase.notifications[userId];
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        return true;
      }
    }
    return false;
  }

  // ===== DONNÉES DE L'UTILISATEUR ACTUEL =====

  getCurrentUserData() {
    const currentUserId = mockDatabase.currentUserId;
    const user = mockDatabase.users[currentUserId];
    
    if (!user) return null;

    return {
      user,
      settings: mockDatabase.userSettings[currentUserId],
      notifications: mockDatabase.notifications[currentUserId] || [],
      joinedSpheres: Object.keys(mockDatabase.sphereMembers).filter(sphereId => 
        mockDatabase.sphereMembers[sphereId][currentUserId]
      ),
      pendingRequests: Object.keys(mockDatabase.pendingRequests).filter(sphereId =>
        mockDatabase.pendingRequests[sphereId]?.some(req => req.userId === currentUserId)
      ),
      createdSpheres: Object.values(mockDatabase.spheres).filter(sphere => 
        sphere.creatorId === currentUserId
      ),
      assignedTasks: this.getTasksByUser(currentUserId),
      userPosts: this.getPostsByUser(currentUserId),
      userResources: this.getResourcesByUser(currentUserId),
      userEvents: this.getEventsByUser(currentUserId)
    };
  }

  // ===== SCÉNARIOS DE TEST =====

  // Scénario 1: Utilisateur admin d'une sphère
  setScenarioAdmin(): void {
    this.setCurrentUser("user_1"); // Max Prime - Admin de IA & ML
  }

  // Scénario 2: Utilisateur avec demande en attente
  setScenarioPending(): void {
    this.setCurrentUser("user_5"); // Roy Darlin - Demande en attente
  }

  // Scénario 3: Utilisateur membre simple
  setScenarioMember(): void {
    this.setCurrentUser("user_2"); // Hussein Boris - Membre
  }

  // Scénario 4: Utilisateur créateur de sphère
  setScenarioCreator(): void {
    this.setCurrentUser("user_3"); // Kana Tommi - Créateur de Économie
  }

  // Scénario 5: Utilisateur doctorant
  setScenarioDoctorant(): void {
    this.setCurrentUser("user_4"); // Nounga Nathan - Doctorat
  }

  // ===== UTILITAIRES =====

  // Obtenir les sphères où l'utilisateur est membre
  getUserJoinedSpheres(userId: string): Sphere[] {
    const joinedSphereIds = Object.keys(mockDatabase.sphereMembers).filter(sphereId => 
      mockDatabase.sphereMembers[sphereId][userId]
    );
    
    return joinedSphereIds.map(sphereId => mockDatabase.spheres[sphereId]);
  }

  // Obtenir les sphères où l'utilisateur a une demande en attente
  getUserPendingSpheres(userId: string): Sphere[] {
    const pendingSphereIds = Object.keys(mockDatabase.pendingRequests).filter(sphereId =>
      mockDatabase.pendingRequests[sphereId]?.some(req => req.userId === userId)
    );
    
    return pendingSphereIds.map(sphereId => mockDatabase.spheres[sphereId]);
  }

  // Vérifier si un utilisateur est membre d'une sphère
  isUserMemberOfSphere(userId: string, sphereId: string): boolean {
    return !!(mockDatabase.sphereMembers[sphereId]?.[userId]);
  }

  // Vérifier si un utilisateur a une demande en attente pour une sphère
  isUserPendingForSphere(userId: string, sphereId: string): boolean {
    return !!(mockDatabase.pendingRequests[sphereId]?.some(req => req.userId === userId));
  }

  // Obtenir le rôle d'un utilisateur dans une sphère
  getUserRoleInSphere(userId: string, sphereId: string): string | null {
    const member = mockDatabase.sphereMembers[sphereId]?.[userId];
    return member ? member.role : null;
  }
}

// Instance singleton
export const mockDB = MockDatabaseService.getInstance();

// Fonctions utilitaires globales
export const getCurrentUser = () => mockDB.getCurrentUser();
export const getCurrentUserId = () => mockDB.getCurrentUserId();
export const setCurrentUser = (userId: string) => mockDB.setCurrentUser(userId);
export const getCurrentUserData = () => mockDB.getCurrentUserData();
