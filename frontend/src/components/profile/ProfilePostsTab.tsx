import { FileText } from "lucide-react";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/ui/empty-state";

interface ProfilePostsTabProps {
  isOwnProfile: boolean;
  posts: any[];
}

export function ProfilePostsTab({ isOwnProfile, posts }: ProfilePostsTabProps) {
  return (
    <section className="space-y-4 mt-6">
      {isOwnProfile && (
        <div className="campus-animate-slide-up">
          <CreatePost />
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun post"
          description="Cet utilisateur n'a pas encore partagé de publications."
        />
      ) : (
        posts.map((post) => (
          <div key={post.id} className="campus-animate-fade-in">
            <PostCard post={post} />
          </div>
        ))
      )}
    </section>
  );
}
