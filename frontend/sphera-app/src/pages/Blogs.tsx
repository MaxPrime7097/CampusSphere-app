import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SpheraHeader } from '../components/layout/SpheraHeader';
import { SpheraFooter } from '../components/layout/SpheraFooter';
import { Calendar, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { blogPosts } from '../data/blogs';

export default function Blogs() {
  const [activeCategory, setActiveCategory] = useState<string>('Tous');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(blogPosts.map(p => p.category)));
    return ['Tous', ...cats];
  }, []);

  const featuredPost = useMemo(() => {
    return blogPosts.find(p => p.isFeatured) || blogPosts[0];
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'Tous') {
      return blogPosts.filter(p => p.id !== featuredPost?.id);
    }
    return blogPosts.filter(p => p.category === activeCategory);
  }, [activeCategory, featuredPost]);

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Le Blog Sphera — Méthodes de révision & Réussite Universitaire',
    description: 'Guides pratiques, sciences de la mémorisation (Active Recall, Pomodoro), stratégies d\'examen et utilisation de l\'IA pour les étudiants.',
    url: 'https://sphera.campussphere.app/blogs',
    publisher: {
      '@type': 'Organization',
      name: 'CampusSphere',
      url: 'https://campussphere.app',
      logo: 'https://sphera.campussphere.app/sphera-logo-dark.png',
    },
    hasPart: blogPosts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://sphera.campussphere.app/blogs/${post.slug}`,
      image: post.imageUrl,
      datePublished: post.isoDate || '2026-09-12T08:00:00+01:00',
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>Le Blog Sphera — Méthodes de Révision, IA & Réussite Étudiante</title>
        <meta
          name="description"
          content="Découvrez nos guides complets pour réviser efficacement vos examens : Active Recall, répétition espacée, révisions de partiels et utilisation intelligente de l'IA."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/blogs" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sphera.campussphere.app/blogs" />
        <meta property="og:title" content="Le Blog Sphera — Méthodes de Révision & Réussite Étudiante" />
        <meta
          property="og:description"
          content="Guides, méthodologies et astuces cognitives pour valider ses examens et réviser sans stress."
        />
        <meta property="og:image" content="https://sphera.campussphere.app/sphera-logo-dark.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://sphera.campussphere.app/blogs" />
        <meta name="twitter:title" content="Le Blog Sphera — Méthodes de Révision & Réussite Étudiante" />
        <meta
          name="twitter:description"
          content="Guides, méthodologies et astuces cognitives pour valider ses examens et réviser sans stress."
        />
        <meta name="twitter:image" content="https://sphera.campussphere.app/sphera-logo-dark.png" />

        {/* Schema.org CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify(collectionJsonLd)}
        </script>
      </Helmet>

      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Le Blog Sphera
            </h1>
            <p className="text-xl text-sphera-text-muted max-w-2xl mx-auto">
              Des guides complets et des méthodes prouvées par les sciences cognitives pour réussir vos partiels et réviser plus efficacement.
            </p>
          </div>

          {/* Featured Article */}
          {featuredPost && (
            <Link
              to={`/blogs/${featuredPost.slug}`}
              className="group block mb-14 rounded-3xl overflow-hidden bg-sphera-surface border border-sphera-border hover:border-sphera-green/50 transition-all duration-300 shadow-xl"
            >
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-auto overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-sphera-green text-black text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" /> À la une
                  </div>
                  <img
                    src={featuredPost.imageUrl}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="text-xs text-sphera-green font-semibold uppercase tracking-wider mb-3">
                    {featuredPost.category}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 group-hover:text-sphera-green transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-sphera-text-muted text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-sphera-text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-sphera-green text-black shadow-md shadow-sphera-green/20'
                    : 'bg-sphera-surface border border-sphera-border text-sphera-text-muted hover:text-white hover:border-sphera-green/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article 
                key={post.id} 
                className="bg-sphera-surface border border-sphera-border rounded-2xl overflow-hidden group hover:border-sphera-green/50 transition-colors flex flex-col h-full shadow-lg"
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
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sphera-green transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-sphera-text-muted text-sm mb-6 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <Link 
                    to={`/blogs/${post.slug}`} 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-sphera-green transition-colors mt-auto"
                  >
                    Lire l'article <ArrowRight className="w-4 h-4" />
                  </Link>
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
  );
}
