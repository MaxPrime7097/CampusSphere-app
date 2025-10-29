import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, ShoppingBag } from "lucide-react";
import { mockDB } from "@/services/mockDatabaseService";

export function SavedItems() {
  // Charger l'utilisateur actuel
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();

  // Posts sauvegardés depuis le mock database
  const savedPosts = useMemo(() => {
    if (!currentUser) return [];
    
    // Récupérer les posts globaux et les transformer pour PostCard
    return mockDB.getGlobalPosts().map(post => ({
      id: post.id,
      author: {
        name: mockDB.getUser(post.authorId)?.name || 'Utilisateur',
        avatar: mockDB.getUser(post.authorId)?.avatar || '/placeholder-avatar.jpg',
        username: mockDB.getUser(post.authorId)?.username || 'user',
        isVerified: mockDB.getUser(post.authorId)?.isVerified || false,
        impactScore: mockDB.getUser(post.authorId)?.impactScore || 0
      },
      content: post.content,
      timestamp: new Date(post.createdAt).toLocaleDateString('fr-FR'),
      likes: post.stats.likes,
      comments: post.stats.comments,
      category: 'Général'
    }));
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground mb-6">
          Éléments enregistrés
        </h1>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </TabsContent>

          <TabsContent value="resources">
            <Card className="campus-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune ressource enregistrée
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
