import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockDB } from '@/services/mockDatabaseService';
import { mockDatabase } from '@/data/mockDatabase';
import { Users, Settings, TestTube } from 'lucide-react';

export function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState(mockDB.getCurrentUser());
  const [isOpen, setIsOpen] = useState(false);

  const handleUserSwitch = (userId: string) => {
    mockDB.setCurrentUser(userId);
    setCurrentUser(mockDB.getCurrentUser());
    setIsOpen(false);
    
    // Recharger la page pour appliquer les changements
    window.location.reload();
  };

  const getScenarioInfo = (userId: string) => {
    const scenarios = {
      "user_1": { name: "Admin", description: "Max Prime - Admin de IA & ML", color: "bg-blue-500" },
      "user_2": { name: "Membre", description: "Hussein Boris - Membre actif", color: "bg-green-500" },
      "user_3": { name: "Créateur", description: "Kana Tommi - Créateur Économie", color: "bg-purple-500" },
      "user_4": { name: "Doctorant", description: "Nounga Nathan - Doctorat", color: "bg-orange-500" },
      "user_5": { name: "En attente", description: "Roy Darlin - Demande en attente", color: "bg-yellow-500" }
    };
    return scenarios[userId as keyof typeof scenarios] || { name: "Utilisateur", description: "", color: "bg-gray-500" };
  };

  const getCurrentUserStats = () => {
    if (!currentUser) return null;
    
    const userData = mockDB.getCurrentUserData();
    return {
      joinedSpheres: userData?.joinedSpheres.length || 0,
      pendingRequests: userData?.pendingRequests.length || 0,
      createdSpheres: userData?.createdSpheres.length || 0,
      assignedTasks: userData?.assignedTasks.length || 0
    };
  };

  if (!currentUser) return null;

  const stats = getCurrentUserStats();
  const currentScenario = getScenarioInfo(currentUser.id);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Dev Mode
        </Button>
      ) : (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Changer d'utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Utilisateur actuel */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="text-xs">
                    {currentUser.firstName?.[0]?.toUpperCase() || ''}{currentUser.lastName?.[0]?.toUpperCase() || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
                </div>
                <Badge className={`text-white ${currentScenario.color}`}>
                  {currentScenario.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {currentScenario.description}
              </p>
              {stats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Sphères:</span>
                    <span className="font-medium">{stats.joinedSpheres}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En attente:</span>
                    <span className="font-medium">{stats.pendingRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Créées:</span>
                    <span className="font-medium">{stats.createdSpheres}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tâches:</span>
                    <span className="font-medium">{stats.assignedTasks}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des utilisateurs */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Autres utilisateurs:</p>
              {Object.values(mockDatabase.users).map((user) => {
                if (user.id === currentUser.id) return null;
                
                const scenario = getScenarioInfo(user.id);
                
                return (
                  <Button
                    key={user.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-auto p-2"
                    onClick={() => handleUserSwitch(user.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.firstName?.[0]?.toUpperCase() || ''}{user.lastName?.[0]?.toUpperCase() || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-xs">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                      <Badge className={`text-white text-xs ${scenario.color}`}>
                        {scenario.name}
                      </Badge>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
