import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Reveal } from '../components/public/SpheraMotion'
import { Calendar, Clock, ArrowRight, Sparkle as Sparkles } from '@phosphor-icons/react'
import { blogPosts } from '../data/blogs'

export default function Blogs(): JSX.Element {
  const { t } = useTranslation('blog')
  const [activeCategory, setActiveCategory] = useState<string>('Tous')

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(blogPosts.map((p) => p.category)))
    return ['Tous', ...cats]
  }, [])

  const featuredPost = useMemo(() => {
    return blogPosts.find((p) => p.isFeatured) || blogPosts[0]
  }, [])

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'Tous') {
      return blogPosts.filter((p) => p.id !== featuredPost?.id)
    }
    return blogPosts.filter((p) => p.category === activeCategory)
  }, [activeCategory, featuredPost])

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('seo.listTitle'),
    description: t('seo.listDescription'),
    url: 'https://sphera.campussphere.app/blogs',
    publisher: {
      '@type': 'Organization',
      name: 'CampusSphere',
      url: 'https://campussphere.app/cs',
      logo: 'https://sphera.campussphere.app/sphera_logo.svg',
    },
    hasPart: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://sphera.campussphere.app/blogs/${post.slug}`,
      image: post.imageUrl,
      datePublished: post.isoDate || '2026-09-12T08:00:00+01:00',
    })),
  }

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('seo.listTitle')}</title>
        <meta name="description" content={t('seo.listDescription')} />
        <link rel="canonical" href="https://sphera.campussphere.app/blogs" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sphera.campussphere.app/blogs" />
        <meta property="og:title" content={t('seo.ogTitle')} />
        <meta property="og:description" content={t('seo.ogDescription')} />
        <meta property="og:image" content="https://sphera.campussphere.app/sphera_preview.webp" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://sphera.campussphere.app/blogs" />
        <meta name="twitter:title" content={t('seo.ogTitle')} />
        <meta name="twitter:description" content={t('seo.ogDescription')} />
        <meta name="twitter:image" content="https://sphera.campussphere.app/sphera_preview.webp" />

        <script type="application/ld+json">{JSON.stringify(collectionJsonLd)}</script>
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-16 pb-24 md:pt-24 relative overflow-hidden">
        <div className="absolute -top-24 right-0 w-[560px] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          {/* Editorial Header */}
          <Reveal immediate className="max-w-2xl mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
              {t('list.eyebrow')}
            </p>
            <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-[-0.03em] text-white mb-4">
              {t('list.title')}
            </h1>
            <p className="text-base sm:text-lg text-sphera-text-muted leading-relaxed">
              {t('list.subtitle')}
            </p>
          </Reveal>

          {/* Featured Article */}
          {featuredPost && (
            <Reveal delay={80}>
              <Link
                to={`/blogs/${featuredPost.slug}`}
                className="sphera-panel-lift group block mb-12 rounded-3xl overflow-hidden bg-sphera-surface border border-sphera-border hover:border-sphera-green/50"
              >
                <div className="grid md:grid-cols-12">
                  <div className="md:col-span-6 h-64 md:h-auto overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 bg-sphera-green text-black text-xs font-bold px-3 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" weight="fill" /> {t('list.featured')}
                    </div>
                    <img
                      src={featuredPost.imageUrl}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="md:col-span-6 p-7 sm:p-10 flex flex-col justify-center">
                    <div className="font-mono text-xs text-sphera-green uppercase tracking-wider mb-3">
                      {featuredPost.category}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4 group-hover:text-sphera-green transition-colors leading-snug">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sphera-text-muted text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-sphera-text-muted font-mono">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {featuredPost.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}

          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-sphera-green text-black'
                    : 'bg-sphera-surface border border-sphera-border text-sphera-text-muted hover:text-white hover:border-sphera-green/40'
                }`}
              >
                {cat === 'Tous' ? t('list.allCategory') : cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sphera-text-muted text-lg">{t('list.emptyCategory')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, idx) => (
                <Reveal key={post.id} delay={(idx % 3) * 60}>
                  <article className="sphera-panel-lift bg-sphera-surface border border-sphera-border rounded-2xl overflow-hidden group hover:border-sphera-green/50 flex flex-col h-full">
                    <Link to={`/blogs/${post.slug}`} className="h-48 overflow-hidden relative block">
                      <div className="absolute top-3.5 left-3.5 z-10 bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono px-2.5 py-1 rounded-full">
                        {post.category}
                      </div>
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-xs font-mono text-sphera-text-muted mb-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.date}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-white mb-2.5 group-hover:text-sphera-green transition-colors line-clamp-2">
                        <Link to={`/blogs/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="text-sphera-text-muted text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <Link
                        to={`/blogs/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-sphera-green transition-colors mt-auto"
                      >
                        <span>{t('list.readArticle')}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
