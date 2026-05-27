import React from 'react'
import { Link } from 'react-router-dom'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { blogPosts } from '../data/blogs'

export default function Blogs() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Le Blog Sphera
            </h1>
            <p className="text-xl text-sphera-text-muted max-w-2xl mx-auto">
              Découvre nos derniers articles sur la méthodologie, l'IA dans l'éducation et la vie étudiante.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article 
                key={post.id} 
                className="bg-sphera-surface border border-sphera-border rounded-2xl overflow-hidden group hover:border-sphera-green/50 transition-colors flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {post.category}
                  </div>
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-sphera-text-muted mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sphera-green transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-sphera-text-muted text-sm mb-6 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <Link 
                    to={`/blogs/${post.id}`} 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-sphera-green transition-colors mt-auto"
                  >
                    Lire l'article <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
