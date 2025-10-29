import { useState, useEffect, useMemo } from "react";
import { mockDB } from "@/services/mockDatabaseService";
import { Users, UserPlus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Supprimé les données mock - utilise maintenant le mock database

export function Connections() {
  // Charger l'utilisateur actuel
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();

  // Connexions depuis le mock database
  const connections = useMemo(() => {
    if (!currentUser) return [];
    const allUsers = mockDB.getAllUsers();
    return allUsers
      .filter(user => user.id !== currentUser.id)
      .map(user => ({
        ...user,
        mutualFriends: Math.floor(Math.random() * 20) + 1 // Mock pour les amis mutuels
      }));
  }, [currentUser]);

  // Suggestions depuis le mock database
  const suggestions = useMemo(() => {
    if (!currentUser) return [];
    const allUsers = mockDB.getAllUsers();
    return allUsers
      .filter(user => user.id !== currentUser.id && connections.every(conn => conn.id !== user.id))
      .map(user => ({
        ...user,
        reason: user.university === currentUser.university ? 
          `Même université - ${user.university}` : 
          `Même filière - ${user.faculty}`
      }));
  }, [currentUser, connections]);

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 campus-gradient p-1.5 rounded-lg text-white" />
            <h1 className="text-3xl font-bold campus-gradient bg-clip-text text-transparent">
              Connexions
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gérez vos connexions et découvrez de nouveaux étudiants
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des connexions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="all">
              Mes Connexions ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          {/* All Connections */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection.id} className="campus-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={connection.avatar} />
                        <AvatarFallback className="campus-gradient text-white text-xl font-bold">
                          {connection.name?.slice(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold">{connection.name}</h3>
                          {connection.isVerified && (
                            <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{connection.username}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {connection.university}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {connection.field}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary">⚡ {connection.impactScore}</span>
                        </div>
                        <div>
                          {connection.mutualFriends} amis communs
                        </div>
                      </div>

                      <Button variant="outline" className="w-full" size="sm">
                        Voir le profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Suggestions */}
          <TabsContent value="suggestions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="campus-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={suggestion.avatar} />
                        <AvatarFallback className="campus-gradient text-white text-xl font-bold">
                          {suggestion.name?.slice(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold">{suggestion.name}</h3>
                          {suggestion.isVerified && (
                            <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{suggestion.username}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.university}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.field}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground italic">
                        {suggestion.reason}
                      </p>

                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary">⚡ {suggestion.impactScore}</span>
                      </div>

                      <Button className="w-full campus-gradient text-white" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Se connecter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}