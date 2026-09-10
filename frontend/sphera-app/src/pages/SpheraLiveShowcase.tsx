import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { 
  Zap, 
  Users, 
  Trophy, 
  Clock, 
  Sparkles, 
  Play, 
  LogIn, 
  ArrowRight, 
  FileUp, 
  Settings2, 
  FileCode, 
  GraduationCap, 
  Gamepad2, 
  Volume2, 
  Smartphone,
  Flame,
  CheckCircle2
} from 'lucide-react'

export default function SpheraLiveShowcase() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>Sphera Live – Quiz Multijoueur en Temps Réel · CampusSphere</title>
        <meta 
          name="description" 
          content="Transformez n'importe quel sujet en quiz multijoueur en direct. Rejoignez avec un simple code PIN sur smartphone, affrontez vos amis et dominez le leaderboard." 
        />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 overflow-hidden">
        {/* ── Hero Section ─────────────────────────────── */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden text-center">
          {/* Ambient Glows */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(circle,rgba(34,197,94,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-sphera-green/5 blur-3xl pointer-events-none -z-10" />

          <div className="container mx-auto max-w-5xl px-4 relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sphera-green/10 border border-sphera-green/30 text-sphera-green text-xs md:text-sm font-bold uppercase tracking-wider mb-8 shadow-lg shadow-sphera-green/10 animate-fade-in-up">
              <Zap className="w-4 h-4 fill-sphera-green" />
              L'expérience multijoueur Sphera
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 animate-fade-in-up">
              Le quiz multijoueur <br />
              <span className="bg-gradient-to-r from-sphera-green via-emerald-400 to-green-300 bg-clip-text text-transparent">
                en direct et sans friction.
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-sphera-text-muted max-w-3xl mb-12 font-light leading-relaxed animate-fade-in-up">
              Que ce soit pour réviser un partiel de médecine en amphi ou pour improviser un blind-test ciné un samedi soir : créez votre partie en 30 secondes, partagez un code PIN et affrontez vos amis en temps réel.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-16 animate-fade-in-up">
              <Link 
                to="/live" 
                className="sphera-primary-btn text-base md:text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2 group shadow-xl shadow-sphera-green/20"
              >
                <Play className="w-5 h-5 fill-black" />
                Héberger une session
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/live/join" 
                className="btn btn-outline border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-white hover:border-sphera-green/50 text-base md:text-lg px-8 py-4 rounded-xl font-semibold w-full sm:w-auto flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-5 h-5 text-sphera-green" />
                Rejoindre avec un code
              </Link>
            </div>

            {/* Quick feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-sphera-text-muted border-t border-sphera-border/60 pt-8 w-full max-w-3xl">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sphera-green" /> Connexion instantanée via CampusSphere SSO
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sphera-green" /> Sons & timer synchronisés
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sphera-green" /> Fonctionne sur n'importe quel smartphone
              </span>
            </div>
          </div>
        </section>

        {/* ── Interactive Live Preview Card ────────────── */}
        <section className="py-12 relative max-w-5xl mx-auto px-4">
          <div className="relative rounded-3xl border border-sphera-green/30 bg-sphera-surface-2/90 backdrop-blur-xl p-6 sm:p-10 shadow-[0_0_80px_rgba(34,197,94,0.15)] overflow-hidden">
            
            {/* Header Simulation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-sphera-border">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sphera-green/20 border border-sphera-green/40 flex items-center justify-center text-sphera-green">
                  <Zap className="w-7 h-7 fill-sphera-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sphera-green uppercase tracking-wider">Salle d'attente active</span>
                    <span className="w-2 h-2 rounded-full bg-sphera-green animate-ping" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Quiz Général : Droit, Sciences & Culture Pop</h3>
                </div>
              </div>

              <div className="bg-sphera-bg border border-sphera-green/30 px-5 py-2.5 rounded-2xl text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-[11px] text-sphera-text-muted uppercase font-mono tracking-wider">Code pour rejoindre</span>
                <span className="font-mono text-2xl font-black text-sphera-green tracking-[0.25em]">LIVE26</span>
              </div>
            </div>

            {/* Question Screen Mockup */}
            <div className="my-8 bg-sphera-bg rounded-2xl border border-sphera-border p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono uppercase text-sphera-text-muted tracking-widest font-bold">Question 7 sur 15</span>
                <div className="flex items-center gap-2 bg-sphera-surface px-3 py-1 rounded-full border border-sphera-border">
                  <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-red-400">05s restantes</span>
                </div>
              </div>

              {/* Progress Timer bar */}
              <div className="w-full bg-sphera-surface h-2 rounded-full mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-sphera-green via-amber-400 to-red-500 h-full w-[35%] rounded-full transition-all" />
              </div>

              <h4 className="text-lg sm:text-2xl font-bold text-white mb-8 leading-snug">
                En quelle année le premier modèle de langage GPT a-t-il été publié par OpenAI ?
              </h4>

              {/* 4 Answers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border text-white text-sm font-medium flex items-center gap-3 hover:border-sphera-green/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-bold flex items-center justify-center text-xs">A</span>
                  <span>2015</span>
                </div>

                <div className="p-4 rounded-xl bg-sphera-green/15 border-2 border-sphera-green text-white text-sm font-bold flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <span className="w-7 h-7 rounded-lg bg-sphera-green text-black font-bold flex items-center justify-center text-xs">B</span>
                  <span>2018</span>
                  <span className="ml-auto text-xs text-sphera-green font-mono uppercase font-bold">+ 1 240 pts</span>
                </div>

                <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border text-white text-sm font-medium flex items-center gap-3 hover:border-sphera-green/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">C</span>
                  <span>2020</span>
                </div>

                <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border text-white text-sm font-medium flex items-center gap-3 hover:border-sphera-green/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">D</span>
                  <span>2022</span>
                </div>
              </div>
            </div>

            {/* Bottom Podium / Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-sphera-surface border border-yellow-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold font-mono">1</div>
                <div>
                  <span className="text-xs text-sphera-text-muted block">Top Scoreur</span>
                  <span className="text-sm font-bold text-white">Alexandre (6 840 pts)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sphera-surface border border-sphera-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-300 flex items-center justify-center font-bold font-mono">2</div>
                <div>
                  <span className="text-xs text-sphera-text-muted block">2ème Place</span>
                  <span className="text-sm font-bold text-white">Sarah N. (6 210 pts)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sphera-surface border border-sphera-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-700/20 text-amber-500 flex items-center justify-center font-bold font-mono">3</div>
                <div>
                  <span className="text-xs text-sphera-text-muted block">3ème Place</span>
                  <span className="text-sm font-bold text-white">Marc B. (5 980 pts)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 3 Ways to Create ─────────────────────────── */}
        <section className="py-24 relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                3 façons simples de créer une partie
              </h2>
              <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
                Générez votre quiz en quelques secondes selon votre inspiration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Option 1 */}
              <div className="sphera-card p-8 flex flex-col group hover:border-sphera-green/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sphera-green/10 border border-sphera-green/30 flex items-center justify-center text-sphera-green mb-6 group-hover:scale-110 transition-transform">
                  <FileUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">Générer par IA</h3>
                <p className="text-sphera-text-muted text-sm leading-relaxed mb-6 flex-1">
                  Glissez-déposez directement votre cours (PDF, Word, TXT) ou collez l'URL d'une ressource CampusSphere. L'IA extrait les points essentiels et fabrique le quiz instantanément.
                </p>
                <div className="text-xs font-mono text-sphera-green bg-sphera-surface-2 p-3 rounded-xl border border-sphera-border">
                  Supporte PDF jusqu'à 50 Mo & liens directs
                </div>
              </div>

              {/* Option 2 */}
              <div className="sphera-card p-8 flex flex-col group hover:border-sphera-green/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-sphera-green/40 transition-transform">
                  <Settings2 className="w-7 h-7 text-sphera-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">Création manuelle</h3>
                <p className="text-sphera-text-muted text-sm leading-relaxed mb-6 flex-1">
                  Gardez le contrôle absolu : écrivez chaque question, vos 4 choix, réglez la réponse exacte et ajustez le temps imparti (de 10 à 60 secondes) selon la difficulté.
                </p>
                <div className="text-xs font-mono text-sphera-green bg-sphera-surface-2 p-3 rounded-xl border border-sphera-border">
                  Idéal pour quiz sur mesure & blind-tests
                </div>
              </div>

              {/* Option 3 */}
              <div className="sphera-card p-8 flex flex-col group hover:border-sphera-green/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-sphera-green/40 transition-transform">
                  <FileCode className="w-7 h-7 text-sphera-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">Importation JSON</h3>
                <p className="text-sphera-text-muted text-sm leading-relaxed mb-6 flex-1">
                  Importez un fichier JSON structuré. Sphera préremplit immédiatement l'éditeur visuel pour vous laisser prévisualiser et retoucher chaque question avant le grand départ.
                </p>
                <div className="text-xs font-mono text-sphera-green bg-sphera-surface-2 p-3 rounded-xl border border-sphera-border">
                  Aperçu et édition pré-lancement inclus
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dual Use Cases: Study & Fun ──────────────── */}
        <section className="py-24 bg-sphera-surface/50 border-y border-sphera-border relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                Deux univers, une même adrénaline
              </h2>
              <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
                Sphera Live s'adapte aussi bien à vos examens qu'à vos soirées.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card 1: Study */}
              <div className="p-8 sm:p-10 rounded-3xl bg-sphera-surface-2 border border-sphera-border flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sphera-green/10 blur-3xl pointer-events-none" />
                
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sphera-green/10 border border-sphera-green/20 text-sphera-green text-xs font-bold uppercase tracking-wider mb-6">
                    <GraduationCap className="w-4 h-4" /> Révisions académiques
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">
                    L'Active Recall en version collective
                  </h3>

                  <p className="text-sphera-text-muted text-base leading-relaxed mb-6">
                    Les neurosciences prouvent que répondre sous contrainte temporelle dans un cadre social multiplie par trois la mémorisation par rapport à la simple relecture passive.
                  </p>

                  <ul className="space-y-3 text-sm text-sphera-text mb-8">
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                      Idéal pour les TD, amphis et groupes de travail en bibliothèque
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                      Repérage instantané des concepts mal compris par le groupe
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                      Simulation fidèle du stress du chrono d'examen
                    </li>
                  </ul>
                </div>

                <Link 
                  to="/live"
                  className="inline-flex items-center gap-2 text-sphera-green font-bold text-sm hover:gap-3 transition-all"
                >
                  Lancer un quiz de révision <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Card 2: Fun */}
              <div className="p-8 sm:p-10 rounded-3xl bg-sphera-surface-2 border border-sphera-border flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl pointer-events-none" />
                
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-6">
                    <Gamepad2 className="w-4 h-4" /> Culture, cinéma & loisirs
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">
                    Le jeu de société réinventé sur écran
                  </h3>

                  <p className="text-sphera-text-muted text-base leading-relaxed mb-6">
                    Vous avez 10 minutes devant vous ou une soirée entre amis ? Lancez un défi sur le foot, les animes, les records insolites ou la pop culture.
                  </p>

                  <ul className="space-y-3 text-sm text-sphera-text mb-8">
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      Questions insolites, cinéma, musique, sport, géographie
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      Tout le monde participe depuis son smartphone
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      Remportez la partie et montez sur la première marche du podium
                    </li>
                  </ul>
                </div>

                <Link 
                  to="/live"
                  className="inline-flex items-center gap-2 text-purple-400 font-bold text-sm hover:gap-3 transition-all"
                >
                  Créer un quiz fun <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Key Features Grid ────────────────────────── */}
        <section className="py-24 relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                Conçu pour une expérience sans accroc
              </h2>
              <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
                Chaque détail est optimisé pour maximiser le plaisir de jeu et la simplicité d'organisation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Smartphone className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Rejoindre en 1 scan</h4>
                <p className="text-sm text-sphera-text-muted">Un simple code PIN à 6 lettres et votre compte connecté pour rejoindre directement la partie.</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Volume2 className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Effets sonores & mute</h4>
                <p className="text-sm text-sphera-text-muted">Des bruitages immersifs pour la tension du chrono, avec un bouton mute d'un clic pour l'amphi.</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Trophy className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Podium & confettis</h4>
                <p className="text-sm text-sphera-text-muted">Célébrez les 3 meilleurs joueurs à l'issue de la partie avec une pluie de confettis animée.</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Flame className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Points au millième</h4>
                <p className="text-sm text-sphera-text-muted">Un algorithme précis qui récompense autant la rapidité de clic que la justesse de réponse.</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Zap className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Relance instantanée</h4>
                <p className="text-sm text-sphera-text-muted">Rejouez la même session avec un nouveau groupe en un clic sans devoir re-saisir les questions.</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Sparkles className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">IA générative connectée</h4>
                <p className="text-sm text-sphera-text-muted">Transformez n'importe quel cours en quiz compétitif en quelques secondes grâce au moteur IA Sphera.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ─────────────────────── */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-b from-sphera-surface-2 to-sphera-surface border border-sphera-green/30 shadow-[0_0_80px_rgba(34,197,94,0.15)] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sphera-green/10 blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 p-3 bg-sphera-green/10 rounded-full text-sphera-green mb-6">
                  <Zap className="w-6 h-6 fill-sphera-green" />
                </div>
                
                <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-6">
                  Prêt pour le grand frisson du buzzer ?
                </h2>
                
                <p className="text-lg text-sphera-text-muted max-w-xl mx-auto mb-10">
                  Créez votre première session Sphera Live en 30 secondes ou rejoignez vos camarades avec leur code.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link 
                    to="/live" 
                    className="sphera-primary-btn text-base px-8 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2 group"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    Lancer mon premier quiz
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link 
                    to="/blogs/10" 
                    className="btn btn-outline border-sphera-border text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 text-base px-8 py-3.5 rounded-xl font-medium w-full sm:w-auto transition-colors"
                  >
                    Lire l'article de blog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SpheraFooter />
    </div>
  )
}
