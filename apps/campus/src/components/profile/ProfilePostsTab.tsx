import { FileText } from "@phosphor-icons/react";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/ui/empty-state";
import { PostSkeleton } from "@/components/ui/skeletons";

interface ProfilePostsTabProps {
  isOwnProfile: boolean;
  posts: any[];
  isLoading?: boolean;
}

export function ProfilePostsTab({ isOwnProfile, posts, isLoading }: ProfilePostsTabProps) {
  return (
    <section className="space-y-4 mt-6">
      {isOwnProfile && (
        <div className="campus-animate-slide-up">
          <CreatePost />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
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
