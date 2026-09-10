import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { blogPosts } from '../data/blogs'

export default function Blogs() {
  const [activeFilter, setActiveFilter] = useState<string>('Tous')

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(blogPosts.map(p => p.category)))
    return ['Tous', ...cats]
  }, [])

  // Featured post (first one marked as featured, or first post)
  const featuredPost = useMemo(() => blogPosts.find(p => p.isFeatured) || blogPosts[0], [])

  // Filter non-featured posts
  const filteredPosts = useMemo(() => {
    const nonFeatured = blogPosts.filter(p => p.id !== featuredPost.id)
    if (activeFilter === 'Tous') return nonFeatured
    return nonFeatured.filter(p => p.category === activeFilter)
  }, [activeFilter, featuredPost.id])

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Le Blog Sphera
            </h1>
            <p className="text-xl text-sphera-text-muted max-w-2xl mx-auto">
              Découvre nos derniers articles sur la méthodologie, l'IA dans l'éducation et la vie étudiante.
            </p>
          </div>

          {/* ── Featured Article ─────────────────────────────── */}
          <Link 
            to={`/blogs/${featuredPost.id}`}
            className="group block mb-16 relative overflow-hidden rounded-3xl border border-sphera-border hover:border-sphera-green/50 transition-all duration-500"
          >
            {/* Badge */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-sphera-green text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-sphera-green/30">
              <Sparkles className="w-3.5 h-3.5" />
              A la une
            </div>

            <div className="grid md:grid-cols-2 min-h-[380px]">
              {/* Image */}
              <div className="relative h-64 md:h-auto overflow-hidden">
                <img 
                  src={featuredPost.imageUrl} 
                  alt={featuredPost.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-sphera-surface/90 hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-sphera-surface to-transparent md:hidden" />
              </div>

              {/* Content */}
              <div className="relative bg-sphera-surface p-8 md:p-12 flex flex-col justify-center">
                <div className="inline-block bg-sphera-surface-2 border border-sphera-border text-sphera-text-muted text-xs font-semibold px-3 py-1 rounded-full mb-6 w-fit">
                  {featuredPost.category}
                </div>
                <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 leading-tight group-hover:text-sphera-green transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-sphera-text-muted text-base md:text-lg mb-8 line-clamp-3 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5 text-sm text-sphera-text-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-sphera-green group-hover:gap-3 transition-all">
                    Lire <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* ── Filter Pills ────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  activeFilter === cat
                    ? 'bg-sphera-green text-black border-sphera-green shadow-md shadow-sphera-green/20'
                    : 'bg-sphera-surface border-sphera-border text-sphera-text-muted hover:border-sphera-green/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Articles Grid ───────────────────────────────── */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sphera-text-muted text-lg">Aucun article dans cette catégorie pour le moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article 
                  key={`${post.id}-${post.title}`} 
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
          )}
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
