import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SpheraHeader } from '../components/layout/SpheraHeader';
import { SpheraFooter } from '../components/layout/SpheraFooter';
import { Calendar, Clock, ArrowLeft, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { blogPosts } from '../data/blogs';

export default function BlogDetail() {
  const params = useParams<{ slug?: string; id?: string }>();
  const identifier = params.slug || params.id;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [identifier]);
  
  const post = blogPosts.find(p => p.slug === identifier || String(p.id) === identifier);

  if (!post) {
    return <Navigate to="/blogs" replace />;
  }

  // Related posts (from same category, or other posts)
  const relatedPosts = blogPosts
    .filter(p => p.id !== post.id)
    .slice(0, 2);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sphera.campussphere.app/blogs/${post.slug}`,
    },
    headline: post.title,
    description: post.excerpt,
    image: [post.imageUrl],
    datePublished: post.isoDate || '2026-09-12T08:00:00+01:00',
    dateModified: post.isoDate || '2026-09-12T08:00:00+01:00',
    author: {
      '@type': 'Organization',
      name: 'Sphera by CampusSphere',
      url: 'https://sphera.campussphere.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CampusSphere',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sphera.campussphere.app/sphera-logo-dark.png',
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{`${post.title} | Blog Sphera`}</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://sphera.campussphere.app/blogs/${post.slug}`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://sphera.campussphere.app/blogs/${post.slug}`} />
        <meta property="og:title" content={`${post.title} | Blog Sphera`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.imageUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://sphera.campussphere.app/blogs/${post.slug}`} />
        <meta name="twitter:title" content={`${post.title} | Blog Sphera`} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.imageUrl} />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
      </Helmet>

      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <article className="container mx-auto px-4 max-w-3xl relative z-10">
          <Link 
            to="/blogs" 
            className="inline-flex items-center gap-2 text-sphera-text-muted hover:text-white transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>

          <div className="mb-8">
            <div className="inline-block bg-sphera-surface border border-sphera-border text-sphera-green text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
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

          {/* Article Body */}
          <div 
            className="text-sphera-text-muted text-lg leading-relaxed space-y-6 
                       [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-6 [&>h2]:font-display
                       [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-4
                       [&>p]:mb-6
                       [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                       [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                       [&>strong]:text-white [&>em]:text-sphera-text-muted
                       max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content as string }}
          />

          {/* Conversion CTA Box */}
          <div className="my-16 p-8 rounded-3xl bg-gradient-to-br from-sphera-surface to-sphera-surface/50 border border-sphera-green/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sphera-green/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 text-sphera-green text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Passez à l'action
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-display">
                  Automatisez vos révisions avec Sphera
                </h3>
                <p className="text-sphera-text-muted text-sm">
                  Importez vos polycopiés et PDF de cours. Obtenez des questions de quiz, flashcards et une fiche de synthèse en 30 secondes.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sphera-green text-black font-bold text-sm hover:opacity-90 transition-all shrink-0 shadow-lg shadow-sphera-green/20"
              >
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="border-t border-sphera-border pt-12 mt-12">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sphera-green" /> Articles recommandés
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedPosts.map(related => (
                  <Link
                    key={related.id}
                    to={`/blogs/${related.slug}`}
                    className="p-5 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-all group block"
                  >
                    <div className="text-xs text-sphera-green font-semibold mb-2">{related.category}</div>
                    <h4 className="font-bold text-white text-base group-hover:text-sphera-green transition-colors mb-2 line-clamp-2">
                      {related.title}
                    </h4>
                    <p className="text-xs text-sphera-text-muted line-clamp-2">
                      {related.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <SpheraFooter />
    </div>
  );
}
