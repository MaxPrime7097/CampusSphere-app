import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  Copy,
  Envelope,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  PaperPlaneTilt,
  Sparkle,
  Spinner,
  TiktokLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { submitContactMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
} from "@/components/public/PublicMotion";
import "@/styles/public-pages.css";

const CONTACT_EMAIL = "contact@campussphere.app";

const SUBJECT_KEYS = [
  "general",
  "partnership",
  "bug",
  "suggestion",
  "account",
  "other",
] as const;

const SHORTCUT_KEYS = ["partnership", "bug", "suggestion"] as const;

const SOCIAL_LINKS = [
  {
    name: "WhatsApp",
    href: "https://whatsapp.com/channel/0029Vb9I6hzDp2QIHVJYpM44",
    icon: WhatsappLogo,
  },
  {
    name: "Facebook",
    href: "https://web.facebook.com/campussphereofficial",
    icon: FacebookLogo,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/campussphere",
    icon: LinkedinLogo,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/campussphere",
    icon: InstagramLogo,
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@campussphere.app",
    icon: TiktokLogo,
  },
] as const;

export function Contact(): JSX.Element {
  const { t } = useTranslation("public");
  const navigate = useNavigate();
  const { toast } = useToast();
  const formCardRef = useRef<HTMLDivElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    newsletter: false,
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

  const handlePickShortcut = (subjectKey: string) => {
    setIsSent(false);
    setFormData((prev) => ({ ...prev, subject: subjectKey }));
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject || !formData.message.trim()) {
      toast({
        variant: "destructive",
        title: t("contact.toasts.requiredTitle"),
        description: t("contact.toasts.requiredDesc"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactMessage({
        ...formData,
        subject: t(`contact.subjects.${formData.subject}`),
      });
      toast({
        title: t("contact.toasts.sentTitle"),
        description: t("contact.toasts.sentDesc"),
      });
      setIsSent(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        newsletter: false,
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        variant: "destructive",
        title: t("contact.toasts.errorTitle"),
        description: t("contact.toasts.errorDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("contact.meta.title")}</title>
        <meta name="description" content={t("contact.meta.description")} />
        <link rel="canonical" href="https://campussphere.app/cs/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("contact.meta.ogTitle")} />
        <meta property="og:description" content={t("contact.meta.ogDescription")} />
        <meta property="og:url" content="https://campussphere.app/cs/contact" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t("contact.meta.ogTitle")} />
        <meta name="twitter:description" content={t("contact.meta.ogDescription")} />
        <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: t("contact.meta.ogTitle"),
            url: "https://campussphere.app/cs/contact",
            description: t("contact.meta.description"),
          })}
        </script>
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── 01. Hero éditorial centré ─────────────────────────────── */}
        <section className="pub-hero" aria-labelledby="contact-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-hero-center">
              <motion.h1
                id="contact-title"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, ease: PUBLIC_EASE }}
              >
                {t("contact.hero.titleLine1")}<br />
                <em>{t("contact.hero.titleLine2")}</em>
              </motion.h1>
              <motion.p
                className="pub-hero-lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: PUBLIC_EASE }}
              >
                {t("contact.hero.lede")}
              </motion.p>
              <motion.div
                className="pub-hero-actions"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, delay: 0.16, ease: PUBLIC_EASE }}
              >
                <button
                  type="button"
                  className="pub-btn pub-btn-orange"
                  onClick={() =>
                    document.getElementById("formulaire")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("contact.hero.ctaPrimary")}{" "}
                  <ArrowDown size={16} weight="duotone" className="pub-icon-down" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() => navigate("/cs/faq")}
                >
                  {t("contact.hero.ctaSecondary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
              </motion.div>
            </div>

            <StaggerGrid className="pub-hero-pillars" mount delayChildren={0.2} stagger={0.07}>
              <StaggerItem className="pub-hero-pillar" y={14}>
                <span className="pub-hero-pillar-num">01</span>
                <b>{t("contact.hero.pillars.emailTitle")}</b>
                <p>
                  {t("contact.hero.pillars.emailPrefix")}{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="pub-hero-pillar-link">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </StaggerItem>
              <StaggerItem className="pub-hero-pillar" y={14}>
                <span className="pub-hero-pillar-num">02</span>
                <b>{t("contact.hero.pillars.responseTitle")}</b>
                <p>{t("contact.hero.pillars.responseDesc")}</p>
              </StaggerItem>
              <StaggerItem className="pub-hero-pillar" y={14}>
                <span className="pub-hero-pillar-num">03</span>
                <b>{t("contact.hero.pillars.listenTitle")}</b>
                <p>{t("contact.hero.pillars.listenDesc")}</p>
              </StaggerItem>
            </StaggerGrid>
          </div>
        </section>

        {/* ── 02. Canaux directs & Formulaire ───────────────────────── */}
        <section
          className="pub-section pub-light"
          id="formulaire"
          aria-label={t("contact.form.ariaLabel")}
        >
          <div className="pub-container">
            <div className="pub-contact-grid">
              {/* Colonne gauche : repères directs & raccourcis */}
              <StaggerGrid className="pub-contact-aside" stagger={0.08}>
                <StaggerItem className="pub-contact-card">
                  <div className="pub-contact-card-head">
                    <div className="pub-contact-card-icon" aria-hidden="true">
                      <Envelope size={20} weight="duotone" />
                    </div>
                    <h3>{t("contact.aside.emailTitle")}</h3>
                  </div>
                  <p>{t("contact.aside.emailDesc")}</p>
                  <div className="pub-contact-email-row">
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                    <button
                      type="button"
                      className="pub-copy-btn"
                      onClick={handleCopyEmail}
                      aria-label={t("contact.aside.copyAria")}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copiedEmail ? (
                          <motion.span
                            key="copied"
                            className="inline-flex items-center gap-1.5 text-emerald-700"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.16 }}
                          >
                            <Check size={14} weight="bold" aria-hidden="true" />
                            {t("contact.aside.copied")}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            className="inline-flex items-center gap-1.5"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.16 }}
                          >
                            <Copy size={14} weight="duotone" aria-hidden="true" />
                            {t("contact.aside.copy")}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </StaggerItem>

                <StaggerItem className="pub-contact-card">
                  <div className="pub-contact-card-head">
                    <div className="pub-contact-card-icon" aria-hidden="true">
                      <Sparkle size={20} weight="duotone" />
                    </div>
                    <h3>{t("contact.aside.shortcutsTitle")}</h3>
                  </div>
                  <p>{t("contact.aside.shortcutsDesc")}</p>
                  <div className="pub-contact-shortcuts">
                    {SHORTCUT_KEYS.map((key) => {
                      const active = formData.subject === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`pub-shortcut-btn${active ? " is-active" : ""}`}
                          onClick={() => handlePickShortcut(key)}
                        >
                          <span>{t(`contact.shortcuts.${key}`)}</span>
                          <ArrowRight size={16} weight="duotone" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </StaggerItem>

                <StaggerItem className="pub-contact-card">
                  <div className="pub-contact-card-head">
                    <div className="pub-contact-card-icon" aria-hidden="true">
                      <WhatsappLogo size={20} weight="duotone" />
                    </div>
                    <h3>{t("contact.aside.socialsTitle")}</h3>
                  </div>
                  <p>{t("contact.aside.socialsDesc")}</p>
                  <div className="pub-contact-socials">
                    {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${name} CampusSphere`}
                        className="pub-social-pill"
                      >
                        <Icon size={17} weight="duotone" aria-hidden="true" />
                        <span>{name}</span>
                      </a>
                    ))}
                  </div>
                </StaggerItem>
              </StaggerGrid>

              {/* Colonne droite : formulaire de contact */}
              <Reveal delay={0.08}>
                <div ref={formCardRef} className="pub-contact-form-card">
                  <AnimatePresence mode="wait">
                    {isSent ? (
                      <motion.div
                        key="sent"
                        className="pub-contact-sent"
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: PUBLIC_EASE }}
                      >
                        <motion.div
                          className="pub-contact-sent-icon"
                          aria-hidden="true"
                          initial={{ scale: 0.5, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 360, damping: 18, delay: 0.08 }}
                        >
                          <CheckCircle size={32} weight="duotone" />
                        </motion.div>
                        <h3>{t("contact.form.sentTitle")}</h3>
                        <p>{t("contact.form.sentDesc")}</p>
                        <button
                          type="button"
                          className="pub-btn pub-btn-dark"
                          onClick={() => setIsSent(false)}
                        >
                          {t("contact.form.sendAnother")}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2>
                          {t("contact.form.titleStart")}{" "}
                          <em>{t("contact.form.titleHighlight")}</em>
                        </h2>
                        <p className="pub-contact-form-sub">{t("contact.form.subtitle")}</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="contact-name"
                                className="font-poppins text-sm font-semibold text-[#18181b]"
                              >
                                {t("contact.form.nameLabel")}
                              </Label>
                              <Input
                                id="contact-name"
                                placeholder={t("contact.form.namePlaceholder")}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="h-11 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="contact-email"
                                className="font-poppins text-sm font-semibold text-[#18181b]"
                              >
                                {t("contact.form.emailLabel")}
                              </Label>
                              <Input
                                id="contact-email"
                                type="email"
                                placeholder={t("contact.form.emailPlaceholder")}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="h-11 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contact-subject"
                              className="font-poppins text-sm font-semibold text-[#18181b]"
                            >
                              {t("contact.form.subjectLabel")}
                            </Label>
                            <Select
                              value={formData.subject}
                              onValueChange={(value) => setFormData({ ...formData, subject: value })}
                            >
                              <SelectTrigger
                                id="contact-subject"
                                className="h-11 bg-white border-black/15 text-[#18181b] focus:ring-[#ff9800] focus:border-[#ff9800]"
                              >
                                <SelectValue placeholder={t("contact.form.subjectPlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBJECT_KEYS.map((key) => (
                                  <SelectItem key={key} value={key}>
                                    {t(`contact.subjects.${key}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contact-message"
                              className="font-poppins text-sm font-semibold text-[#18181b]"
                            >
                              {t("contact.form.messageLabel")}
                            </Label>
                            <Textarea
                              id="contact-message"
                              placeholder={t("contact.form.messagePlaceholder")}
                              rows={6}
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              required
                              className="bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 resize-y focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                            />
                          </div>

                          <div className="flex items-start gap-2.5 pt-1">
                            <Checkbox
                              id="contact-newsletter"
                              checked={formData.newsletter}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, newsletter: Boolean(checked) })
                              }
                              className="mt-0.5 border-black/25 data-[state=checked]:bg-[#ff9800] data-[state=checked]:border-[#ff9800]"
                            />
                            <Label
                              htmlFor="contact-newsletter"
                              className="font-nunito text-sm text-[#52525b] font-normal leading-snug cursor-pointer"
                            >
                              {t("contact.form.newsletterLabel")}
                            </Label>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="pub-btn pub-btn-orange w-full disabled:opacity-60 disabled:pointer-events-none"
                          >
                            {isSubmitting ? (
                              <>
                                <Spinner size={18} className="animate-spin pub-icon-static" aria-hidden="true" />
                                {t("contact.form.submitting")}
                              </>
                            ) : (
                              <>
                                {t("contact.form.submit")}
                                <PaperPlaneTilt size={17} weight="duotone" aria-hidden="true" />
                              </>
                            )}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 03. Bandeau final Orange (Relais FAQ) ─────────────────── */}
        <section className="pub-section pub-orange" aria-label={t("contact.cta.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("contact.cta.titleLine1")}<br />
                  <em>{t("contact.cta.titleLine2")}</em>
                </h2>
                <p>{t("contact.cta.body")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate("/cs/faq")}
                >
                  {t("contact.cta.ctaPrimary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() => navigate("/register")}
                >
                  {t("contact.cta.ctaSecondary")}
                </button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </PublicMotionProvider>
  );
}

export default Contact;
