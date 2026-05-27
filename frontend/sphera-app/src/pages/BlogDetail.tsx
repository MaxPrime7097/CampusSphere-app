import React from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import { blogPosts } from '../data/blogs'

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const post = blogPosts.find(p => p.id === Number(id))

  if (!post) {
    return <Navigate to="/blogs" replace />
  }

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <article className="container mx-auto px-4 max-w-3xl relative z-10">
          <Link 
            to="/blogs" 
            className="inline-flex items-center gap-2 text-sphera-text-muted hover:text-white transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux articles
          </Link>

          <div className="mb-8">
            <div className="inline-block bg-sphera-surface border border-sphera-border text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">
              {post.category}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-sphera-text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </div>
            </div>
          </div>

          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-12 border border-sphera-border">
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>

          <div 
            className="text-sphera-text-muted text-lg leading-relaxed space-y-6 
                       [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-6
                       [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-4
                       [&>p]:mb-6
                       [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                       [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                       [&>strong]:text-white [&>em]:text-sphera-text-muted
                       max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content as string }}
          />
        </article>
      </main>

      <SpheraFooter />
    </div>
  )
}
