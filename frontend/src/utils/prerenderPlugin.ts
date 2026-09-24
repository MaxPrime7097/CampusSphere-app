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

      // ─────────────────────────────────────────────────────────────
      // 1. Landing Page Metadata & Semantic Noscript (/ and /cs-inc)
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

      const landingNoscriptHtml = `
      <header>
        <h1>CampusSphere - Le réseau social qui connecte les étudiants</h1>
        <p>Rejoignez la communauté étudiante en ligne : sphères collaboratives, partage de cours et ressources universitaires, vie de campus et révisions avec l'IA Sphera.</p>
      </header>
      <main>
        <section>
          <h2>Plateforme étudiante &amp; Réseau social universitaire</h2>
          <p>Partagez des cours entre étudiants, collaborez au sein de groupes d'étude interactifs et optimisez l'organisation de vos études.</p>
        </section>
        <section>
          <h2>Fonctionnalités clés de CampusSphere</h2>
          <article>
            <h3>Groupes d'étude &amp; Sphères Collaboratives</h3>
            <p>Créez et rejoignez des espaces de travail thématiques. Tableau Kanban pour piloter vos projets, espace de cours partagé pour centraliser documents et notes, et chat étudiant instantané.</p>
          </article>
          <article>
            <h3>Partager des cours &amp; Ressources universitaires</h3>
            <p>Bibliothèque collaborative d'annales d'examens et fiches de révision partagées par des étudiants ayant validé la matière.</p>
          </article>
          <article>
            <h3>Feed Universitaire avec Impact Score</h3>
            <p>Un fil d'actualité académique qui valorise les publications utiles et l'entraide entre étudiants.</p>
          </article>
          <article>
            <h3>Plateforme Vie Étudiante &amp; Événements</h3>
            <p>Calendrier centralisé des conférences, soirées d'intégration, hackathons et événements associatifs de votre campus.</p>
          </article>
          <article>
            <h3>Sphera IA : Assistante académique personnelle</h3>
            <p>Générez des fiches de révision, résolvez des annales d'examens avec correction pas-à-pas et créez des quiz personnalisés.</p>
          </article>
        </section>
      </main>
      <nav>
        <a href="/cs-inc">Accueil</a> |
        <a href="/cs-inc/about">À propos</a> |
        <a href="/cs-inc/faq">FAQ</a> |
        <a href="/cs-inc/contact">Contact</a> |
        <a href="/login">Connexion</a> |
        <a href="/register">Inscription</a> |
        <a href="https://sphera.campussphere.app">Sphera IA</a>
      </nav>
      `.trim();

      const injectPrerender = (
        targetRelativeDir: string,
        metaTitle: string,
        metaDesc: string,
        canonicalUrl: string,
        noscriptContent: string,
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
        
        // IMPORTANT: <div id="root"></div> remains UNTOUCHED so real users NEVER see a flash on refresh!
        // Crawlers and non-JS clients read noscript and head metadata.
        if (noscriptContent) {
          html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>\n${noscriptContent}\n    </noscript>`);
        }

        fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
        console.log(`✓ [prerender-campus] Generated /dist/${targetRelativeDir}/index.html (no visual flash)`);
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
      rootHtml = rootHtml.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>\n${landingNoscriptHtml}\n    </noscript>`);
      // <div id="root"></div> REMAINS UNTOUCHED to eliminate any flicker
      fs.writeFileSync(templatePath, rootHtml, 'utf-8');
      console.log(`✓ [prerender-campus] Prerendered dist/index.html (root, no visual flash)`);

      // 2. /cs-inc
      injectPrerender(
        'cs-inc',
        landingTitle,
        landingDesc,
        'https://campussphere.app/cs-inc',
        landingNoscriptHtml,
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
      const aboutNoscriptHtml = `
      <header>
        <h1>À Propos de CampusSphere - Notre Histoire &amp; Vision</h1>
        <p>La plateforme étudiante qui révolutionne l'apprentissage collaboratif et connecte les étudiants dans une communauté d'entraide, de partage de cours et d'excellence.</p>
      </header>
      <main>
        <section>
          <h2>La Vision Originelle (2025)</h2>
          <p>CampusSphere est né en 2025 de la vision d'une communauté étudiante plus connectée et collaborative. Fondée par des étudiants passionnés par l'innovation technologique et l'éducation, notre plateforme répond concrètement aux défis du quotidien universitaire : dispersion des ressources, manque d'outils d'organisation pour les groupes d'étude et absence d'un espace d'entraide dédié.</p>
        </section>
        <section>
          <h2>Notre Mission</h2>
          <p>Bâtir le premier réseau social étudiant centré sur la valeur académique et l'entraide mutuelle. Permettre à chaque étudiant d'accéder instantanément aux cours partagés, de s'entraîner sur des annales universitaires et de progresser sereinement tout au long de son cursus.</p>
        </section>
      </main>
      <nav>
        <a href="/cs-inc">Accueil</a> |
        <a href="/cs-inc/faq">FAQ</a> |
        <a href="/cs-inc/contact">Contact</a> |
        <a href="/register">Rejoindre la communauté</a>
      </nav>
      `.trim();
      injectPrerender('cs-inc/about', aboutTitle, aboutDesc, 'https://campussphere.app/cs-inc/about', aboutNoscriptHtml, aboutJsonLd);

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

      const faqNoscriptHtml = `
      <header>
        <h1>Foire Aux Questions (FAQ) - CampusSphere</h1>
        <p>Toutes les réponses pour utiliser au mieux CampusSphere : partage de cours, groupes d'étude étudiants, révisions avec Sphera IA et organisation académique.</p>
      </header>
      <main>
        <section>
          <h2>Questions fréquentes</h2>
          <ul>
            ${faqItems.map(item => `
              <li>
                <h3>${item.q}</h3>
                <p>${item.a}</p>
              </li>
            `).join('')}
          </ul>
        </section>
      </main>
      <nav>
        <a href="/cs-inc">Accueil</a> |
        <a href="/cs-inc/about">À propos</a> |
        <a href="/cs-inc/contact">Contact</a> |
        <a href="/register">Inscription</a>
      </nav>
      `.trim();
      injectPrerender('cs-inc/faq', faqTitle, faqDesc, 'https://campussphere.app/cs-inc/faq', faqNoscriptHtml, faqJsonLd);

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
      const contactNoscriptHtml = `
      <header>
        <h1>Contactez l'Équipe CampusSphere</h1>
        <p>Nous sommes à votre écoute pour toute question relative à votre compte, vos groupes d'étude ou les partenariats universitaires.</p>
      </header>
      <main>
        <section>
          <h2>Canaux de contact</h2>
          <p><strong>Assistance &amp; Technique :</strong> support@campussphere.app</p>
          <p><strong>Partenariats &amp; Campus :</strong> contact@campussphere.app</p>
          <p><strong>Juridique &amp; Données :</strong> policies@campussphere.app</p>
        </section>
      </main>
      <nav>
        <a href="/cs-inc">Accueil</a> |
        <a href="/cs-inc/about">À propos</a> |
        <a href="/cs-inc/faq">FAQ</a>
      </nav>
      `.trim();
      injectPrerender('cs-inc/contact', contactTitle, contactDesc, 'https://campussphere.app/cs-inc/contact', contactNoscriptHtml, contactJsonLd);

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

        const pPageHtml = template
          .replace(/<title>.*?<\/title>/, `<title>${p.title}</title>`)
          .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeAttr(p.desc)}" />`)
          .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${p.canonical}" />`);

        fs.writeFileSync(path.join(targetDir, 'index.html'), pPageHtml, 'utf-8');
        console.log(`✓ [prerender-campus] Generated /dist/${p.dir}/index.html`);
      }
    }
  };
}
