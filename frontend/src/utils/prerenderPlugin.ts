import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function prerenderPublicPagesPlugin(): Plugin {
  return {
    name: 'prerender-campus-public-pages',
    closeBundle() {
      const distDir = path.resolve(__dirname, '../../dist');
      const templatePath = path.join(distDir, 'index.html');

      if (!fs.existsSync(templatePath)) {
        console.warn('[prerender-campus-public-pages] dist/index.html not found, skipping.');
        return;
      }

      const template = fs.readFileSync(templatePath, 'utf-8');

      const ensureDir = (dir: string) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      };

      const publicHeader = `
    <header style="position:sticky; top:0; z-index:50; background:rgba(18,18,18,0.88); backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,0.1);">
      <div style="max-width:1200px; margin:0 auto; padding:0 1.25rem; height:4.25rem; display:flex; align-items:center; justify-content:space-between;">
        <a href="/cs-inc" style="display:flex; align-items:center; gap:0.65rem; text-decoration:none;">
          <img src="/CS.svg" alt="CampusSphere Logo" width="36" height="36" />
          <span style="font-size:1.35rem; font-weight:800; color:#ff9800; font-family:sans-serif; letter-spacing:-0.02em;">CampusSphere</span>
        </a>
        <nav style="display:flex; align-items:center; gap:1.25rem; font-size:0.95rem; font-weight:600;">
          <a href="/cs-inc/about" style="color:#a1a1aa; text-decoration:none;">À propos</a>
          <a href="/cs-inc/faq" style="color:#a1a1aa; text-decoration:none;">FAQ</a>
          <a href="/cs-inc/contact" style="color:#a1a1aa; text-decoration:none;">Contact</a>
          <a href="/login" style="color:#ff9800; text-decoration:none; margin-left:0.5rem;">Connexion</a>
          <a href="/register" style="background:#ff9800; color:#ffffff; padding:0.55rem 1.15rem; border-radius:0.5rem; text-decoration:none; font-weight:700;">Rejoins la communauté</a>
        </nav>
      </div>
    </header>
      `.trim();

      const publicFooter = `
    <footer style="background:#0a0a0a; border-top:1px solid rgba(255,255,255,0.1); padding:3.5rem 1.5rem 2rem;">
      <div style="max-width:1100px; margin:0 auto;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:2rem; margin-bottom:2.5rem; text-align:left;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
              <img src="/CS.svg" alt="CampusSphere" width="28" height="28" />
              <span style="font-size:1.15rem; font-weight:800; color:#ff9800;">CampusSphere</span>
            </div>
            <p style="color:#a1a1aa; font-size:0.9rem; line-height:1.5;">Le premier réseau social étudiant et plateforme d'entraide universitaire. Connectez-vous, partagez des cours et progressez ensemble.</p>
          </div>
          <div>
            <h4 style="color:#ffffff; font-size:0.95rem; font-weight:700; margin-bottom:1rem;">Plateforme</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:2; font-size:0.9rem;">
              <li><a href="/cs-inc" style="color:#a1a1aa; text-decoration:none;">Accueil</a></li>
              <li><a href="/cs-inc/about" style="color:#a1a1aa; text-decoration:none;">À propos</a></li>
              <li><a href="/cs-inc/faq" style="color:#a1a1aa; text-decoration:none;">Foire aux questions</a></li>
              <li><a href="/cs-inc/contact" style="color:#a1a1aa; text-decoration:none;">Contact & Support</a></li>
            </ul>
          </div>
          <div>
            <h4 style="color:#ffffff; font-size:0.95rem; font-weight:700; margin-bottom:1rem;">Outils & IA</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:2; font-size:0.9rem;">
              <li><a href="https://sphera.campussphere.app" target="_blank" rel="noopener noreferrer" style="color:#10b981; text-decoration:none; font-weight:600;">Sphera IA Académique &rarr;</a></li>
              <li><a href="/register" style="color:#a1a1aa; text-decoration:none;">Rejoindre un groupe d'étude</a></li>
              <li><a href="/register" style="color:#a1a1aa; text-decoration:none;">Partager des cours</a></li>
            </ul>
          </div>
          <div>
            <h4 style="color:#ffffff; font-size:0.95rem; font-weight:700; margin-bottom:1rem;">Légal & Confidentialité</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:2; font-size:0.9rem;">
              <li><a href="/cs-inc/policies" style="color:#a1a1aa; text-decoration:none;">Centre des politiques</a></li>
              <li><a href="/cs-inc/policies/privacy" style="color:#a1a1aa; text-decoration:none;">Confidentialité</a></li>
              <li><a href="/cs-inc/policies/terms" style="color:#a1a1aa; text-decoration:none;">CGU</a></li>
              <li><a href="/cs-inc/policies/terms-of-sale" style="color:#a1a1aa; text-decoration:none;">CGV</a></li>
            </ul>
          </div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:1.5rem; text-align:center; color:#71717a; font-size:0.85rem;">
          <p>&copy; 2026 CampusSphere. Tous droits réservés. Le réseau social dédié à la communauté étudiante.</p>
        </div>
      </div>
    </footer>
      `.trim();

      // ─────────────────────────────────────────────────────────────
      // 1. Landing Page HTML (/ and /cs-inc)
      // ─────────────────────────────────────────────────────────────
      const landingTitle = "CampusSphere | Réseau Social Étudiant & Plateforme d'Entraide Universitaire";
      const landingDesc = "CampusSphere est le réseau social étudiant de référence. Rejoignez votre communauté étudiante en ligne : partagez des cours entre étudiants, créez des groupes d'étude et révisez avec Sphera IA.";
      
      const landingJsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://campussphere.app/#website',
            name: 'CampusSphere',
            url: 'https://campussphere.app',
            description: landingDesc,
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://campussphere.app/search?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'EducationalOrganization',
            '@id': 'https://campussphere.app/#organization',
            name: 'CampusSphere',
            url: 'https://campussphere.app',
            logo: 'https://campussphere.app/CS.svg',
            description: 'Le réseau social étudiant conçu pour la communauté universitaire et le partage de cours.',
            sameAs: [
              'https://web.facebook.com/campussphereofficial',
              'https://www.linkedin.com/company/campussphere',
              'https://www.instagram.com/campussphere'
            ]
          }
        ]
      };

      const landingRootHtml = `
<div id="root">
  <div class="min-h-screen bg-background text-foreground flex flex-col" style="font-family:sans-serif; background-color:#0f0f11; color:#f4f4f5;">
    ${publicHeader}

    <main class="flex-1">
      <!-- Hero Section -->
      <section style="max-width:1150px; margin:0 auto; padding:4.5rem 1.5rem 3rem; text-align:center;">
        <div style="display:inline-block; padding:0.35rem 1rem; border-radius:9999px; background:rgba(255,152,0,0.12); color:#ff9800; font-size:0.85rem; font-weight:700; margin-bottom:1.5rem; letter-spacing:0.04em; text-transform:uppercase;">
          Plateforme étudiante &amp; Réseau social universitaire
        </div>
        <h1 style="font-size:3rem; font-weight:900; line-height:1.15; margin-bottom:1.5rem; color:#ffffff; max-width:950px; margin-left:auto; margin-right:auto;">
          Le réseau social étudiant qui connecte la communauté universitaire
        </h1>
        <p style="font-size:1.25rem; color:#a1a1aa; max-width:780px; margin:0 auto 2.5rem; line-height:1.6;">
          Rejoins la communauté étudiante en ligne : partage des cours entre étudiants, collabore au sein de groupes d'étude interactifs et optimise l'organisation de tes études.
        </p>
        <div style="display:flex; justify-content:center; gap:1.2rem; flex-wrap:wrap; margin-bottom:3.5rem;">
          <a href="/register" style="background:linear-gradient(135deg, #ff9800, #ff5722); color:#ffffff; padding:0.95rem 2.25rem; border-radius:0.75rem; text-decoration:none; font-weight:700; font-size:1.1rem; display:inline-block; box-shadow:0 10px 25px rgba(255,152,0,0.25);">
            Rejoins CampusSphere gratuitement &rarr;
          </a>
          <a href="/cs-inc/about" style="border:1px solid rgba(255,255,255,0.2); color:#e4e4e7; padding:0.95rem 1.8rem; border-radius:0.75rem; text-decoration:none; font-weight:600; font-size:1.05rem; display:inline-block; background:rgba(255,255,255,0.03);">
            Découvrir notre mission
          </a>
        </div>
      </section>

      <!-- Key Features Section (Non-Brand Focus) -->
      <section style="max-width:1150px; margin:0 auto; padding:3rem 1.5rem 4rem;">
        <div style="text-align:center; margin-bottom:3.5rem;">
          <h2 style="font-size:2.4rem; font-weight:800; color:#ffffff; margin-bottom:1rem;">
            Tout ce dont tu as besoin pour réussir tes études
          </h2>
          <p style="color:#a1a1aa; font-size:1.15rem; max-width:700px; margin:0 auto;">
            Une plateforme tout-en-un développée par et pour les étudiants pour réviser, échanger et s'organiser.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:2rem;">
          <article style="padding:2.2rem; border-radius:1rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#ff9800; font-size:0.85rem; font-weight:700; text-transform:uppercase; margin-bottom:0.6rem;">Groupes d'étude &amp; Sphères</div>
            <h3 style="font-size:1.45rem; font-weight:700; margin-bottom:1rem; color:#ffffff;">Organisation des études en équipe</h3>
            <p style="color:#a1a1aa; line-height:1.6; margin-bottom:1.2rem;">
              Crée des groupes d'étude étudiants par promotion, matière ou filière. Coordonne tes révisions grâce à un tableau Kanban visuel, un chat de groupe instantané et un dashboard d'activité partagé.
            </p>
            <ul style="padding-left:1.25rem; color:#d4d4d8; line-height:1.7; font-size:0.95rem;">
              <li>Tableau Kanban pour planifier devoirs et examens</li>
              <li>Chat étudiant instantané sans distraction extérieure</li>
              <li>Centralisation des documents de révision du groupe</li>
            </ul>
          </article>

          <article style="padding:2.2rem; border-radius:1rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#ff9800; font-size:0.85rem; font-weight:700; text-transform:uppercase; margin-bottom:0.6rem;">Ressources &amp; Annales</div>
            <h3 style="font-size:1.45rem; font-weight:700; margin-bottom:1rem; color:#ffffff;">Partager des cours entre étudiants</h3>
            <p style="color:#a1a1aa; line-height:1.6; margin-bottom:1.2rem;">
              Accède à une immense bibliothèque de ressources universitaires partagées par tes pairs : fiches synthétiques, annales universitaires corrigées, résumés de cours et exercices d'entraînement.
            </p>
            <ul style="padding-left:1.25rem; color:#d4d4d8; line-height:1.7; font-size:0.95rem;">
              <li>Filtres précis par matière, filière et niveau d'études</li>
              <li>Dépôt de cours et fiches en quelques clics</li>
              <li>Annales corrigées pour préparer sereinement les partiels</li>
            </ul>
          </article>

          <article style="padding:2.2rem; border-radius:1rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#ff9800; font-size:0.85rem; font-weight:700; text-transform:uppercase; margin-bottom:0.6rem;">Feed Intelligent</div>
            <h3 style="font-size:1.45rem; font-weight:700; margin-bottom:1rem; color:#ffffff;">Entraide académique &amp; Impact Score</h3>
            <p style="color:#a1a1aa; line-height:1.6; margin-bottom:1.2rem;">
              Un fil d'actualité universitaire qui valorise les publications utiles. Pose des questions académiques, partage des conseils méthodologiques et gagne des points de réputation.
            </p>
            <ul style="padding-left:1.25rem; color:#d4d4d8; line-height:1.7; font-size:0.95rem;">
              <li>Impact Score : algorithme qui favorise le contenu utile</li>
              <li>Pose tes questions aux étudiants des promos supérieures</li>
              <li>Fini le bruit des réseaux généralistes</li>
            </ul>
          </article>

          <article style="padding:2.2rem; border-radius:1rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);">
            <div style="color:#ff9800; font-size:0.85rem; font-weight:700; text-transform:uppercase; margin-bottom:0.6rem;">Vie de Campus</div>
            <h3 style="font-size:1.45rem; font-weight:700; margin-bottom:1rem; color:#ffffff;">Plateforme vie étudiante &amp; Événements</h3>
            <p style="color:#a1a1aa; line-height:1.6; margin-bottom:1.2rem;">
              Reste connecté avec la vie associative et les initiatives de ton université. Conférences, ateliers de révision collectifs, hackathons et rencontres inter-étudiants.
            </p>
            <ul style="padding-left:1.25rem; color:#d4d4d8; line-height:1.7; font-size:0.95rem;">
              <li>Calendrier des événements universitaires en direct</li>
              <li>Création et inscription en 1 clic</li>
              <li>Échange avec les participants avant chaque session</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- Sphera Bridge Section -->
      <section style="max-width:1150px; margin:1rem auto 4rem; padding:2.8rem; border-radius:1.5rem; background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,78,59,0.28)); border:1px solid rgba(16,185,129,0.35);">
        <div style="color:#10b981; font-weight:bold; font-size:0.85rem; text-transform:uppercase; margin-bottom:0.5rem; letter-spacing:0.05em;">Intelligence Artificielle Académique</div>
        <h2 style="font-size:2.2rem; font-weight:800; margin-bottom:1rem; color:#ffffff;">Sphera : Votre assistante de révision IA intégrée</h2>
        <p style="color:#a1a1aa; line-height:1.6; margin-bottom:1.8rem; max-width:780px; font-size:1.1rem;">
          Révisez plus intelligemment : transformez vos cours en fiches de synthèse, quiz interactifs, flashcards et résolvez des annales d'examens avec une correction pas-à-pas basée sur l'IA.
        </p>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <a href="https://sphera.campussphere.app" target="_blank" rel="noopener noreferrer" style="background:#10b981; color:#ffffff; padding:0.85rem 1.8rem; border-radius:0.6rem; text-decoration:none; font-weight:700; display:inline-block;">
            Essayer Sphera gratuitement &rarr;
          </a>
          <a href="/cs-inc/faq" style="border:1px solid rgba(255,255,255,0.25); color:#ffffff; padding:0.85rem 1.5rem; border-radius:0.6rem; text-decoration:none; font-weight:600; display:inline-block;">
            Voir les questions fréquentes
          </a>
        </div>
      </section>

      <!-- Final Call to Action -->
      <section style="text-align:center; padding:5rem 1.5rem 6rem; background:linear-gradient(180deg, transparent, rgba(255,152,0,0.06)); border-top:1px solid rgba(255,255,255,0.08);">
        <h2 style="font-size:2.5rem; font-weight:900; margin-bottom:1rem; color:#ff9800;">
          Prêt à transformer l'organisation de vos études ?
        </h2>
        <p style="color:#a1a1aa; max-width:640px; margin:0 auto 2.2rem; font-size:1.15rem; line-height:1.6;">
          Rejoignez des étudiants de toute filière sur CampusSphere. Partagez des cours, créez vos groupes de travail et boostez vos résultats dès aujourd'hui.
        </p>
        <a href="/register" style="background:#ff9800; color:#ffffff; padding:0.95rem 2.4rem; border-radius:0.75rem; text-decoration:none; font-weight:700; font-size:1.15rem; display:inline-block; box-shadow:0 10px 30px rgba(255,152,0,0.3);">
          Créer mon compte étudiant gratuit
        </a>
      </section>
    </main>

    ${publicFooter}
  </div>
</div>
      `.trim();

      const injectPrerender = (
        targetRelativeDir: string,
        metaTitle: string,
        metaDesc: string,
        canonicalUrl: string,
        bodyHtml: string,
        schemaObj?: object
      ) => {
        const targetDir = path.join(distDir, targetRelativeDir);
        ensureDir(targetDir);

        let html = template
          .replace(/<title>.*?<\/title>/, `<title>${metaTitle}</title>`)
          .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(metaDesc)}" />`)
          .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);

        const headAdditions = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttr(metaTitle)}" />
    <meta property="og:description" content="${escapeAttr(metaDesc)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="https://campussphere.app/CS.svg" />
    <meta property="og:site_name" content="CampusSphere" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(metaTitle)}" />
    <meta name="twitter:description" content="${escapeAttr(metaDesc)}" />
    <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
    ${schemaObj ? `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n    </script>` : ''}
        `.trim();

        html = html.replace('</head>', `  ${headAdditions}\n</head>`);
        html = html.replace(/<div id="root"><\/div>/, bodyHtml);

        fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
        console.log(`✓ [prerender-campus] Generated /dist/${targetRelativeDir}/index.html`);
      };

      // 1. Root page (/)
      let rootHtml = template
        .replace(/<title>.*?<\/title>/, `<title>${landingTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(landingDesc)}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://campussphere.app/" />`);
      
      const rootHeadAdditions = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttr(landingTitle)}" />
    <meta property="og:description" content="${escapeAttr(landingDesc)}" />
    <meta property="og:url" content="https://campussphere.app/" />
    <meta property="og:image" content="https://campussphere.app/CS.svg" />
    <meta property="og:site_name" content="CampusSphere" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(landingTitle)}" />
    <meta name="twitter:description" content="${escapeAttr(landingDesc)}" />
    <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
    <script type="application/ld+json">
${JSON.stringify(landingJsonLd, null, 2)}
    </script>
      `.trim();
      rootHtml = rootHtml.replace('</head>', `  ${rootHeadAdditions}\n</head>`);
      rootHtml = rootHtml.replace(/<div id="root"><\/div>/, landingRootHtml);
      fs.writeFileSync(templatePath, rootHtml, 'utf-8');
      console.log(`✓ [prerender-campus] Prerendered dist/index.html (root)`);

      // 2. /cs-inc
      injectPrerender(
        'cs-inc',
        landingTitle,
        landingDesc,
        'https://campussphere.app/cs-inc',
        landingRootHtml,
        landingJsonLd
      );

      // ─────────────────────────────────────────────────────────────
      // 3. /cs-inc/about
      // ─────────────────────────────────────────────────────────────
      const aboutTitle = "À Propos - Le Réseau Social Étudiant & Notre Mission | CampusSphere";
      const aboutDesc = "Découvrez l'histoire de CampusSphere, l'équipe fondatrice et notre mission : créer le premier réseau social étudiant et plateforme d'entraide universitaire.";
      const aboutJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: aboutTitle,
        url: 'https://campussphere.app/cs-inc/about',
        description: aboutDesc,
        mainEntity: {
          '@type': 'EducationalOrganization',
          name: 'CampusSphere',
          url: 'https://campussphere.app',
          logo: 'https://campussphere.app/CS.svg',
          description: "Plateforme étudiante et réseau social d'entraide universitaire."
        }
      };
      const aboutHtml = `
<div id="root">
  <div class="min-h-screen bg-background text-foreground flex flex-col" style="font-family:sans-serif; background-color:#0f0f11; color:#f4f4f5;">
    ${publicHeader}
    <main class="flex-1">
      <section style="max-width:1050px; margin:0 auto; padding:4.5rem 1.5rem 3rem; text-align:center;">
        <div style="display:inline-block; padding:0.35rem 1rem; border-radius:9999px; background:rgba(255,152,0,0.12); color:#ff9800; font-size:0.85rem; font-weight:700; margin-bottom:1.5rem;">
          Notre Histoire &amp; Vision
        </div>
        <h1 style="font-size:2.8rem; font-weight:900; line-height:1.2; margin-bottom:1.5rem; color:#ffffff;">
          À Propos de CampusSphere
        </h1>
        <p style="font-size:1.2rem; color:#a1a1aa; max-width:760px; margin:0 auto 2.5rem; line-height:1.6;">
          La plateforme étudiante qui révolutionne l'apprentissage collaboratif et connecte les étudiants dans une communauté d'entraide, de partage de cours et d'excellence.
        </p>
      </section>

      <section style="max-width:900px; margin:0 auto; padding:2rem 1.5rem 4rem; line-height:1.8; color:#d4d4d8; font-size:1.05rem;">
        <h2 style="font-size:1.8rem; font-weight:800; color:#ffffff; margin-bottom:1rem;">La Vision Originelle (2025)</h2>
        <p style="margin-bottom:2rem; color:#a1a1aa;">
          CampusSphere est né en 2025 de la vision d'une communauté étudiante plus connectée et collaborative. Fondée par des étudiants passionnés par l'innovation technologique et l'éducation, notre plateforme répond concrètement aux défis du quotidien universitaire : dispersion des ressources, manque d'outils d'organisation pour les groupes d'étude et absence d'un espace d'entraide dédié.
        </p>

        <h2 style="font-size:1.8rem; font-weight:800; color:#ffffff; margin-bottom:1rem;">Notre Mission</h2>
        <p style="margin-bottom:2rem; color:#a1a1aa;">
          Bâtir le premier réseau social étudiant centré sur la valeur académique et l'entraide mutuelle. Permettre à chaque étudiant d'accéder instantanément aux cours partagés, de s'entraîner sur des annales universitaires et de progresser sereinement tout au long de son cursus.
        </p>

        <div style="text-align:center; margin-top:3rem;">
          <a href="/register" style="background:#ff9800; color:#ffffff; padding:0.85rem 2rem; border-radius:0.6rem; text-decoration:none; font-weight:700; font-size:1.05rem; display:inline-block;">
            Rejoindre la communauté étudiante &rarr;
          </a>
        </div>
      </section>
    </main>
    ${publicFooter}
  </div>
</div>
      `.trim();
      injectPrerender('cs-inc/about', aboutTitle, aboutDesc, 'https://campussphere.app/cs-inc/about', aboutHtml, aboutJsonLd);

      // ─────────────────────────────────────────────────────────────
      // 4. /cs-inc/faq
      // ─────────────────────────────────────────────────────────────
      const faqTitle = "FAQ - Réseau Social Étudiant & Entraide Académique | CampusSphere";
      const faqDesc = "Toutes les réponses à vos questions sur CampusSphere : partager des cours entre étudiants, créer des groupes d'étude, réviser avec Sphera IA et organiser vos études.";
      const faqItems = [
        {
          q: "Comment créer un compte sur CampusSphere ?",
          a: "Cliquez sur 'S'inscrire' en haut de la page et complétez votre profil avec vos informations académiques (université, filière, niveau d'études) et vos centres d'intérêt."
        },
        {
          q: "Comment fonctionnent les groupes d'étude et les Sphères sur CampusSphere ?",
          a: "Une Sphère est un groupe d'étude thématique dédié à une promotion, un cours spécifique ou un projet. Chaque groupe dispose d'un tableau Kanban visuel, d'un espace partagé de cours et documents, ainsi que d'un chat instantané en temps réel."
        },
        {
          q: "Comment partager des cours entre étudiants sur la plateforme ?",
          a: "Vous pouvez importer des cours, fiches de révision, résumés et exercices directement dans une Sphère ou dans la bibliothèque communautaire. Vos documents sont vérifiés puis immédiatement accessibles pour aider vos camarades."
        },
        {
          q: "Où trouver des annales universitaires et des fiches de révision gratuites ?",
          a: "Dans l'onglet Ressources et dans la Bibliothèque, utilisez les filtres par discipline, matière et niveau d'études (Licence, Master, Prépas) pour télécharger gratuitement des annales d'examens et fiches partagées par d'autres étudiants."
        },
        {
          q: "Qu'est-ce que Sphera IA et comment m'aide-t-elle à réviser ?",
          a: "Sphera est l'assistante d'apprentissage IA intégrée à l'écosystème CampusSphere. Elle synthétise vos supports de cours en fiches claires, génère des flashcards, des quiz adaptatifs et corrige les annales d'examens pas-à-pas."
        },
        {
          q: "Quels outils sont proposés pour l'organisation des études ?",
          a: "CampusSphere intègre une suite d'outils d'organisation : tableau Kanban par groupe de travail, dashboard de suivi des devoirs, alertes d'échéances et calendrier des événements du campus."
        },
        {
          q: "En quoi CampusSphere se distingue-t-il d'un réseau social classique ?",
          a: "CampusSphere est conçu exclusivement pour les étudiants et la vie universitaire, sans publicité intrusive ni algorithmes sensationnalistes. Tout y est pensé pour l'entraide, le partage de connaissances et la réussite aux examens."
        },
        {
          q: "CampusSphere est-il gratuit ?",
          a: "Oui, l'accès à CampusSphere est entièrement gratuit pour les fonctionnalités essentielles : profil, sphères d'études, messagerie et partage de documents."
        }
      ];

      const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: faqTitle,
        url: 'https://campussphere.app/cs-inc/faq',
        description: faqDesc,
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a
          }
        }))
      };

      const faqHtml = `
<div id="root">
  <div class="min-h-screen bg-background text-foreground flex flex-col" style="font-family:sans-serif; background-color:#0f0f11; color:#f4f4f5;">
    ${publicHeader}
    <main class="flex-1">
      <section style="max-width:900px; margin:0 auto; padding:4.5rem 1.5rem 2rem; text-align:center;">
        <div style="display:inline-block; padding:0.35rem 1rem; border-radius:9999px; background:rgba(255,152,0,0.12); color:#ff9800; font-size:0.85rem; font-weight:700; margin-bottom:1.5rem;">
          Centre d'Aide &amp; Questions
        </div>
        <h1 style="font-size:2.8rem; font-weight:900; line-height:1.2; margin-bottom:1.5rem; color:#ffffff;">
          Foire Aux Questions (FAQ)
        </h1>
        <p style="font-size:1.15rem; color:#a1a1aa; max-width:680px; margin:0 auto 2.5rem; line-height:1.6;">
          Toutes les réponses pour utiliser au mieux CampusSphere : partage de cours, groupes d'étude étudiants, révisions avec Sphera IA et organisation académique.
        </p>
      </section>

      <section style="max-width:850px; margin:0 auto; padding:1rem 1.5rem 5rem;">
        <div>
          ${faqItems.map(item => `
            <details style="margin-bottom:1.2rem; padding:1.25rem 1.5rem; border-radius:0.75rem; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08);">
              <summary style="font-size:1.15rem; font-weight:700; cursor:pointer; color:#ffffff; outline:none;">
                ${item.q}
              </summary>
              <p style="color:#a1a1aa; line-height:1.65; margin-top:0.85rem; font-size:1rem;">
                ${item.a}
              </p>
            </details>
          `).join('')}
        </div>

        <div style="margin-top:3.5rem; padding:2rem; border-radius:1rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); text-align:center;">
          <h3 style="font-size:1.3rem; font-weight:700; color:#ffffff; margin-bottom:0.5rem;">Vous avez une autre question ?</h3>
          <p style="color:#a1a1aa; font-size:0.95rem; margin-bottom:1.5rem;">Notre équipe est à votre disposition pour vous accompagner.</p>
          <a href="/cs-inc/contact" style="background:#ff9800; color:#ffffff; padding:0.7rem 1.5rem; border-radius:0.5rem; text-decoration:none; font-weight:700; display:inline-block;">
            Contactez le support &rarr;
          </a>
        </div>
      </section>
    </main>
    ${publicFooter}
  </div>
</div>
      `.trim();
      injectPrerender('cs-inc/faq', faqTitle, faqDesc, 'https://campussphere.app/cs-inc/faq', faqHtml, faqJsonLd);

      // ─────────────────────────────────────────────────────────────
      // 5. /cs-inc/contact
      // ─────────────────────────────────────────────────────────────
      const contactTitle = "Contactez l'Équipe CampusSphere | Support & Partenariats";
      const contactDesc = "Une question, une suggestion ou un partenariat ? Contactez directement l'équipe CampusSphere par email ou via notre formulaire.";
      const contactJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: contactTitle,
        url: 'https://campussphere.app/cs-inc/contact',
        description: contactDesc
      };
      const contactHtml = `
<div id="root">
  <div class="min-h-screen bg-background text-foreground flex flex-col" style="font-family:sans-serif; background-color:#0f0f11; color:#f4f4f5;">
    ${publicHeader}
    <main class="flex-1">
      <section style="max-width:900px; margin:0 auto; padding:4.5rem 1.5rem 3rem; text-align:center;">
        <div style="display:inline-block; padding:0.35rem 1rem; border-radius:9999px; background:rgba(255,152,0,0.12); color:#ff9800; font-size:0.85rem; font-weight:700; margin-bottom:1.5rem;">
          Support &amp; Partenariats
        </div>
        <h1 style="font-size:2.8rem; font-weight:900; line-height:1.2; margin-bottom:1.5rem; color:#ffffff;">
          Contactez l'Équipe CampusSphere
        </h1>
        <p style="font-size:1.15rem; color:#a1a1aa; max-width:680px; margin:0 auto 2.5rem; line-height:1.6;">
          Nous sommes à votre écoute pour toute question relative à votre compte, vos groupes d'étude ou les partenariats universitaires.
        </p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.5rem; margin-top:2rem; text-align:left;">
          <div style="padding:1.8rem; border-radius:0.75rem; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08);">
            <h3 style="font-size:1.15rem; font-weight:700; color:#ffffff; margin-bottom:0.5rem;">Assistance &amp; Technique</h3>
            <p style="color:#a1a1aa; font-size:0.95rem; margin-bottom:1rem;">Problème de compte, bug ou question sur la plateforme :</p>
            <a href="mailto:support@campussphere.app" style="color:#ff9800; font-weight:700; text-decoration:none;">support@campussphere.app</a>
          </div>
          <div style="padding:1.8rem; border-radius:0.75rem; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08);">
            <h3 style="font-size:1.15rem; font-weight:700; color:#ffffff; margin-bottom:0.5rem;">Partenariats &amp; Campus</h3>
            <p style="color:#a1a1aa; font-size:0.95rem; margin-bottom:1rem;">Associations étudiantes, universités et relations presse :</p>
            <a href="mailto:contact@campussphere.app" style="color:#ff9800; font-weight:700; text-decoration:none;">contact@campussphere.app</a>
          </div>
          <div style="padding:1.8rem; border-radius:0.75rem; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08);">
            <h3 style="font-size:1.15rem; font-weight:700; color:#ffffff; margin-bottom:0.5rem;">Juridique &amp; Données</h3>
            <p style="color:#a1a1aa; font-size:0.95rem; margin-bottom:1rem;">RGPD, suppression de données et signalements :</p>
            <a href="mailto:policies@campussphere.app" style="color:#ff9800; font-weight:700; text-decoration:none;">policies@campussphere.app</a>
          </div>
        </div>
      </section>
    </main>
    ${publicFooter}
  </div>
</div>
      `.trim();
      injectPrerender('cs-inc/contact', contactTitle, contactDesc, 'https://campussphere.app/cs-inc/contact', contactHtml, contactJsonLd);

      // ─────────────────────────────────────────────────────────────
      // 6. /cs-inc/policies & Legal subpages
      // ─────────────────────────────────────────────────────────────
      const policiesPages = [
        {
          dir: 'cs-inc/policies',
          canonical: 'https://campussphere.app/cs-inc/policies',
          title: 'Centre des Politiques & Mentions Légales | CampusSphere',
          desc: 'Consultez l\'ensemble des politiques de confidentialité, mentions légales, CGU et CGV de CampusSphere.'
        },
        {
          dir: 'cs-inc/policies/privacy',
          canonical: 'https://campussphere.app/cs-inc/policies/privacy',
          title: 'Politique de Confidentialité | CampusSphere',
          desc: 'Informations sur la collecte, le traitement et la protection de vos données personnelles sur CampusSphere conformément au RGPD.'
        },
        {
          dir: 'cs-inc/policies/terms',
          canonical: 'https://campussphere.app/cs-inc/policies/terms',
          title: 'Conditions Générales d\'Utilisation (CGU) | CampusSphere',
          desc: 'Conditions régissant l\'accès et l\'utilisation du réseau social étudiant CampusSphere.'
        },
        {
          dir: 'cs-inc/policies/terms-of-sale',
          canonical: 'https://campussphere.app/cs-inc/policies/terms-of-sale',
          title: 'Conditions Générales de Vente (CGV) | CampusSphere',
          desc: 'Conditions relatives aux crédits et souscriptions Sphera IA et paiements Mobile Money.'
        },
        {
          dir: 'cs-inc/policies/community-guidelines',
          canonical: 'https://campussphere.app/cs-inc/policies/community-guidelines',
          title: 'Règles de la Communauté | CampusSphere',
          desc: 'Principes d\'entraide, de respect mutuel et règles de modération au sein de CampusSphere.'
        },
        {
          dir: 'cs-inc/policies/copyright',
          canonical: 'https://campussphere.app/cs-inc/policies/copyright',
          title: 'Politique de Droits d\'Auteur | CampusSphere',
          desc: 'Respect de la propriété intellectuelle, droits d\'auteur et procédure de signalement DMCA.'
        },
        {
          dir: 'cs-inc/policies/cookiepolicy',
          canonical: 'https://campussphere.app/cs-inc/policies/cookiepolicy',
          title: 'Politique de Cookies | CampusSphere',
          desc: 'Informations sur l\'utilisation des cookies essentiels au fonctionnement de CampusSphere.'
        },
        {
          dir: 'cs-inc/policies/datadeletion',
          canonical: 'https://campussphere.app/cs-inc/policies/datadeletion',
          title: 'Suppression des Données | CampusSphere',
          desc: 'Procédure pour demander l\'effacement définitif de votre compte et de vos données personnelles.'
        },
        {
          dir: 'cs-inc/policies/legal-notice',
          canonical: 'https://campussphere.app/cs-inc/policies/legal-notice',
          title: 'Mentions Légales | CampusSphere',
          desc: 'Mentions légales relatives à l\'éditeur CampusSphere, l\'hébergement et l\'infrastructure.'
        },
        {
          dir: 'cs-inc/waitlist',
          canonical: 'https://campussphere.app/cs-inc/waitlist',
          title: 'Liste d\'Attente | CampusSphere',
          desc: 'Inscrivez-vous pour être averti en avant-première des nouveautés CampusSphere.'
        },
        {
          dir: 'login',
          canonical: 'https://campussphere.app/login',
          title: 'Connexion Étudiant | CampusSphere',
          desc: 'Connectez-vous à votre espace étudiant CampusSphere pour accéder à vos sphères et cours partagés.'
        },
        {
          dir: 'register',
          canonical: 'https://campussphere.app/register',
          title: 'Inscription Gratuite Étudiant | CampusSphere',
          desc: 'Créez votre compte gratuit sur CampusSphere, le réseau social étudiant et plateforme d\'entraide universitaire.'
        }
      ];

      for (const p of policiesPages) {
        const targetDir = path.join(distDir, p.dir);
        ensureDir(targetDir);

        let pPageHtml = template
          .replace(/<title>.*?<\/title>/, `<title>${p.title}</title>`)
          .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(p.desc)}" />`)
          .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${p.canonical}" />`);

        fs.writeFileSync(path.join(targetDir, 'index.html'), pPageHtml, 'utf-8');
        console.log(`✓ [prerender-campus] Generated /dist/${p.dir}/index.html`);
      }
    }
  };
}
