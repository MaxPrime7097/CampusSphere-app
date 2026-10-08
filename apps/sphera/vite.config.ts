import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { blogPosts } from './src/data/blogs';

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function prerenderBlogsPlugin(): Plugin {
  return {
    name: 'prerender-blogs',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const templatePath = path.join(distDir, 'index.html');
      if (!fs.existsSync(templatePath)) {
        console.warn('[prerender-blogs] Template dist/index.html not found, skipping prerender.');
        return;
      }

      const template = fs.readFileSync(templatePath, 'utf-8');

      // Helper to ensure a directory exists
      const ensureDir = (dir: string) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      };

      // ─────────────────────────────────────────────────────────────
      // 1. Pre-render /blogs/index.html
      // ─────────────────────────────────────────────────────────────
      const blogsDir = path.join(distDir, 'blogs');
      ensureDir(blogsDir);

      const blogsTitle = 'Le Blog Sphera — Méthodes de Révision, IA & Réussite Étudiante';
      const blogsDesc = 'Guides complets et méthodes scientifiques pour réviser efficacement vos examens : Active Recall, répétition espacée, gestion des partiels et utilisation de l\'IA.';
      const blogsUrl = 'https://sphera.campussphere.app/blogs';

      const blogsJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: blogsTitle,
        description: blogsDesc,
        url: blogsUrl,
        publisher: {
          '@type': 'Organization',
          name: 'CampusSphere',
          url: 'https://campussphere.app',
          logo: 'https://sphera.campussphere.app/sphera_logo.svg',
        },
        hasPart: blogPosts.map(p => ({
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.excerpt,
          url: `https://sphera.campussphere.app/blogs/${p.slug}`,
          image: p.imageUrl,
          datePublished: p.isoDate || '2026-09-12T08:00:00+01:00',
        })),
      };

      const blogsArticlesHtml = blogPosts
        .map(
          p => `
          <article style="margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.5rem;">
            <div style="color: #22c55e; font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">${p.category}</div>
            <h2 style="margin: 0.5rem 0 1rem;"><a href="/blogs/${p.slug}" style="color: #ffffff; text-decoration: none;">${p.title}</a></h2>
            <p style="color: #a1a1aa; font-size: 0.95rem; line-height: 1.6;">${p.excerpt}</p>
            <div style="color: #71717a; font-size: 0.85rem; margin-top: 1rem;">${p.date} • ${p.readTime}</div>
            <p><a href="/blogs/${p.slug}" style="color: #22c55e; font-weight: bold; text-decoration: none;">Lire l'article &rarr;</a></p>
          </article>`
        )
        .join('\n');

      const blogsPageHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${blogsTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(blogsDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${blogsUrl}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeAttr(blogsTitle)}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeAttr(blogsDesc)}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${blogsUrl}" />`)
        .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeAttr(blogsTitle)}" />`)
        .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeAttr(blogsDesc)}" />`)
        .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${blogsUrl}" />`)
        .replace(
          /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
          `<script type="application/ld+json">\n${JSON.stringify(blogsJsonLd, null, 2)}\n</script>`
        )
        .replace(
          /<div id="root"><\/div>/,
          `<div id="root">
            <main style="max-width: 1100px; margin: 0 auto; padding: 6rem 1.5rem;">
              <header style="text-align: center; margin-bottom: 4rem;">
                <h1 style="font-size: 3rem; color: #ffffff; margin-bottom: 1rem;">Le Blog Sphera</h1>
                <p style="font-size: 1.25rem; color: #a1a1aa; max-width: 650px; margin: 0 auto;">${blogsDesc}</p>
              </header>
              <section>
                ${blogsArticlesHtml}
              </section>
            </main>
          </div>`
        );

      fs.writeFileSync(path.join(blogsDir, 'index.html'), blogsPageHtml, 'utf-8');
      console.log('✓ [prerender-blogs] Generated /dist/blogs/index.html');

      // ─────────────────────────────────────────────────────────────
      // 2. Pre-render every individual blog post
      // ─────────────────────────────────────────────────────────────
      for (const post of blogPosts) {
        const postUrl = `https://sphera.campussphere.app/blogs/${post.slug}`;
        const postTitle = `${post.title} | Blog Sphera`;
        const postDesc = post.excerpt;

        const postJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': postUrl,
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
              url: 'https://sphera.campussphere.app/sphera_logo.svg',
            },
          },
        };

        const postContentHtml = `
          <div id="root">
            <main style="max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7;">
              <nav style="margin-bottom: 2rem;">
                <a href="/blogs" style="color: #a1a1aa; text-decoration: none;">&larr; Retour au blog</a>
              </nav>
              <article>
                <header style="margin-bottom: 2.5rem;">
                  <div style="color: #22c55e; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; margin-bottom: 0.75rem;">
                    ${post.category}
                  </div>
                  <h1 style="font-size: 2.5rem; line-height: 1.2; color: #ffffff; margin-bottom: 1rem;">
                    ${post.title}
                  </h1>
                  <div style="color: #71717a; font-size: 0.9rem;">
                    ${post.date} • Temps de lecture : ${post.readTime}
                  </div>
                </header>

                <div style="margin-bottom: 3rem; border-radius: 1rem; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                  <img src="${post.imageUrl}" alt="${escapeAttr(post.title)}" style="width: 100%; height: auto; display: block;" />
                </div>

                <div style="font-size: 1.15rem; line-height: 1.8; color: #d4d4d8;">
                  ${post.content}
                </div>

                <div style="margin-top: 4rem; padding: 2.5rem; border-radius: 1.5rem; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3);">
                  <h3 style="color: #ffffff; font-size: 1.5rem; margin-top: 0; margin-bottom: 0.75rem;">Passez à la pratique avec Sphera</h3>
                  <p style="color: #a1a1aa; font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem;">
                    Importez vos cours en PDF ou polycopiés et laissez l'IA générer automatiquement vos 20 questions de quiz, 20 flashcards et vos fiches de synthèse.
                  </p>
                  <a href="/register" style="display: inline-block; background: #22c55e; color: #000000; font-weight: bold; padding: 0.85rem 1.75rem; border-radius: 0.75rem; text-decoration: none;">
                    Essayer Sphera gratuitement &rarr;
                  </a>
                </div>
              </article>
            </main>
          </div>`;

        const articleHtml = template
          .replace(/<title>.*?<\/title>/, `<title>${postTitle}</title>`)
          .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(postDesc)}" />`)
          .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${postUrl}" />`)
          .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeAttr(postTitle)}" />`)
          .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeAttr(postDesc)}" />`)
          .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${postUrl}" />`)
          .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${post.imageUrl}" />`)
          .replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="article" />`)
          .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeAttr(postTitle)}" />`)
          .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeAttr(postDesc)}" />`)
          .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${postUrl}" />`)
          .replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${post.imageUrl}" />`)
          .replace(
            /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
            `<script type="application/ld+json">\n${JSON.stringify(postJsonLd, null, 2)}\n</script>`
          )
          .replace(/<div id="root"><\/div>/, postContentHtml);

        // 1) Write to /dist/blogs/${post.slug}/index.html
        const postSlugDir = path.join(blogsDir, post.slug);
        ensureDir(postSlugDir);
        fs.writeFileSync(path.join(postSlugDir, 'index.html'), articleHtml, 'utf-8');

        // 2) Write to /dist/blogs/${post.id}/index.html (backward compatibility with numeric IDs)
        const postIdDir = path.join(blogsDir, String(post.id));
        ensureDir(postIdDir);
        fs.writeFileSync(path.join(postIdDir, 'index.html'), articleHtml, 'utf-8');

        console.log(`✓ [prerender-blogs] Generated /dist/blogs/${post.slug}/index.html & /dist/blogs/${post.id}/index.html`);
      }

      // ─────────────────────────────────────────────────────────────
      // 3. Pre-render /pricing/index.html
      // ─────────────────────────────────────────────────────────────
      const pricingDir = path.join(distDir, 'pricing');
      ensureDir(pricingDir);
      const pricingTitle = 'Tarifs Sphera — Accès 100% Gratuit Bêta & Outils de Révision IA';
      const pricingDesc = 'Sphera est actuellement 100% gratuit pendant toute la période de bêta ouverte. Profitez de générations illimitées de fiches, quiz interactifs de 20 questions et flashcards par IA.';
      const pricingHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${pricingTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(pricingDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://sphera.campussphere.app/pricing" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeAttr(pricingTitle)}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeAttr(pricingDesc)}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://sphera.campussphere.app/pricing" />`)
        .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeAttr(pricingTitle)}" />`)
        .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeAttr(pricingDesc)}" />`)
        .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="https://sphera.campussphere.app/pricing" />`)
        .replace(/<div id="root"><\/div>/, `<div id="root"><main style="max-width: 900px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7;">
          <h1 style="font-size: 2.5rem; color: #ffffff; margin-bottom: 1rem;">Tarifs Sphera — 100% Gratuit pendant la Bêta</h1>
          <p style="font-size: 1.25rem; color: #a1a1aa; margin-bottom: 2rem;">Toutes les fonctionnalités sont disponibles sans limite : fiches de synthèse, quiz de 20 questions, 20 flashcards, correction d'annales et Sphera Live.</p>
          <div style="border: 1px solid #22c55e; border-radius: 1.5rem; padding: 2.5rem; text-align: center; background: rgba(34,197,94,0.05); margin-bottom: 2rem;">
            <div style="font-size: 3rem; font-weight: bold; color: #ffffff;">0 XAF</div>
            <p style="color: #22c55e; font-weight: bold;">Accès complet et illimité pendant la bêta ouverte</p>
          </div>
          <p><a href="/register" style="display: inline-block; background: #22c55e; color: #000000; font-weight: bold; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none;">Commencer gratuitement</a></p>
        </main></div>`);
      fs.writeFileSync(path.join(pricingDir, 'index.html'), pricingHtml, 'utf-8');
      console.log('✓ [prerender-pages] Generated /dist/pricing/index.html');

      // ─────────────────────────────────────────────────────────────
      // 4. Pre-render /privacy/index.html & /terms/index.html
      // ─────────────────────────────────────────────────────────────
      const privacyDir = path.join(distDir, 'privacy');
      ensureDir(privacyDir);
      const privacyTitle = 'Politique de Confidentialité — Sphera by CampusSphere';
      const privacyDesc = 'Protection de vos données personnelles et utilisation sécurisée de vos documents de cours sur Sphera.';
      const privacyHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${privacyTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(privacyDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://sphera.campussphere.app/privacy" />`)
        .replace(/<div id="root"><\/div>/, `<div id="root"><main style="max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7;">
          <h1 style="font-size: 2rem; color: #ffffff;">Politique de Confidentialité</h1>
          <p style="color: #a1a1aa; line-height: 1.6;">Protection rigoureuse des données étudiantes, chiffrement des documents téléversés et respect des réglementations sur la vie privée.</p>
        </main></div>`);
      fs.writeFileSync(path.join(privacyDir, 'index.html'), privacyHtml, 'utf-8');
      console.log('✓ [prerender-pages] Generated /dist/privacy/index.html');

      const termsDir = path.join(distDir, 'terms');
      ensureDir(termsDir);
      const termsTitle = "Conditions Générales d'Utilisation — Sphera by CampusSphere";
      const termsDesc = 'Conditions générales d\'utilisation et règles de la plateforme de révision Sphera.';
      const termsHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${termsTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(termsDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://sphera.campussphere.app/terms" />`)
        .replace(/<div id="root"><\/div>/, `<div id="root"><main style="max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7;">
          <h1 style="font-size: 2rem; color: #ffffff;">Conditions Générales d'Utilisation</h1>
          <p style="color: #a1a1aa; line-height: 1.6;">Règles d'utilisation de la plateforme Sphera, utilisation éthique de l'IA et engagements de service pour les étudiants.</p>
        </main></div>`);
      fs.writeFileSync(path.join(termsDir, 'index.html'), termsHtml, 'utf-8');
      console.log('✓ [prerender-pages] Generated /dist/terms/index.html');

      // ─────────────────────────────────────────────────────────────
      // 4b. Pre-render /legal-notice/index.html & /terms-of-sale/index.html
      // ─────────────────────────────────────────────────────────────
      const legalDir = path.join(distDir, 'legal-notice');
      ensureDir(legalDir);
      const legalTitle = "Mentions Légales — Sphera by CampusSphere";
      const legalDesc = "Mentions légales de Sphera : éditeur, hébergeur cloud Render, Microsoft Azure, AWS et coordonnées légales.";
      const legalHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${legalTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(legalDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://sphera.campussphere.app/legal-notice" />`)
        .replace(/<div id="root"><\/div>/, `<div id="root"><main style="max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7;">
          <h1 style="font-size: 2rem; color: #ffffff;">Mentions Légales</h1>
          <p style="color: #a1a1aa; line-height: 1.6;">Informations légales, éditeur CampusSphere et hébergement cloud (Render, Azure, AWS).</p>
        </main></div>`);
      fs.writeFileSync(path.join(legalDir, 'index.html'), legalHtml, 'utf-8');
      console.log('✓ [prerender-pages] Generated /dist/legal-notice/index.html');

      const saleDir = path.join(distDir, 'terms-of-sale');
      ensureDir(saleDir);
      const saleTitle = "Conditions Générales de Vente (CGV) — Sphera by CampusSphere";
      const saleDesc = "Conditions Générales de Vente de Sphera : abonnements d'assistance IA, pass d'examen, paiements Mobile Money et conditions de rétractation.";
      const saleHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${saleTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(saleDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://sphera.campussphere.app/terms-of-sale" />`)
        .replace(/<div id="root"><\/div>/, `<div id="root"><main style="max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7;">
          <h1 style="font-size: 2rem; color: #ffffff;">Conditions Générales de Vente</h1>
          <p style="color: #a1a1aa; line-height: 1.6;">Conditions d'accès, abonnements et paiements Mobile Money sécurisés pour l'assistant IA Sphera.</p>
        </main></div>`);
      fs.writeFileSync(path.join(saleDir, 'index.html'), saleHtml, 'utf-8');
      console.log('✓ [prerender-pages] Generated /dist/terms-of-sale/index.html');

      // ─────────────────────────────────────────────────────────────
      // 5. Pre-render /sphera-live/index.html
      // ─────────────────────────────────────────────────────────────
      const liveDir = path.join(distDir, 'sphera-live');
      ensureDir(liveDir);
      const liveTitle = 'Sphera Live — Quiz Multijoueur en Temps Réel pour Réviser entre Amis';
      const liveDesc = 'Défiez vos camarades de promotion en direct sur vos cours universitaires avec Sphera Live.';
      const liveHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${liveTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(liveDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://sphera.campussphere.app/sphera-live" />`)
        .replace(/<div id="root"><\/div>/, `<div id="root"><main style="max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem; color: #e4e4e7; text-align: center;">
          <h1 style="font-size: 2.5rem; color: #ffffff; margin-bottom: 1rem;">Sphera Live — Quiz Multijoueur en Direct</h1>
          <p style="font-size: 1.15rem; color: #a1a1aa; margin-bottom: 2rem;">Affrontez vos camarades en temps réel sur n'importe quel sujet de cours ou de culture générale.</p>
          <p><a href="/blogs/sphera-live-quiz-multijoueur-en-direct" style="color: #22c55e; font-weight: bold; font-size: 1.1rem; text-decoration: underline;">Lire le guide complet de Sphera Live &rarr;</a></p>
        </main></div>`);
      fs.writeFileSync(path.join(liveDir, 'index.html'), liveHtml, 'utf-8');
      console.log('✓ [prerender-pages] Generated /dist/sphera-live/index.html');
    },
  };
}

export default defineConfig({
  plugins: [react(), prerenderBlogsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-i18next', 'i18next'],
  },
  server: {
    port: 5174,
    host: true,
  },
});
