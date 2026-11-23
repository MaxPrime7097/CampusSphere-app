import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function CommunityGuidelines(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "respect", title: t("communityGuidelines.toc.s1") },
      { id: "securite", title: t("communityGuidelines.toc.s2") },
      { id: "contenu-approprie", title: t("communityGuidelines.toc.s3") },
      { id: "collaboration", title: t("communityGuidelines.toc.s4") },
      { id: "sanctions", title: t("communityGuidelines.toc.s5") },
      { id: "signaler", title: t("communityGuidelines.toc.s6") },
      { id: "contact", title: t("communityGuidelines.toc.s7") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("communityGuidelines.meta.title")}
      metaDescription={t("communityGuidelines.meta.description")}
      canonical="https://campussphere.app/cs/policies/community-guidelines"
      ogTitle={t("communityGuidelines.meta.ogTitle")}
      ogDescription={t("communityGuidelines.meta.ogDescription")}
      title={t("communityGuidelines.header.title")}
      highlight={t("communityGuidelines.header.highlight")}
      subtitle={t("communityGuidelines.header.subtitle")}
      lastUpdated={t("communityGuidelines.header.lastUpdated")}
      currentSlug="/cs/policies/community-guidelines"
      sections={sections}
    >
      <section id="respect" className="pub-legal-section">
        <h2>{t("communityGuidelines.s1.title")}</h2>
        <ul>
          {(["i1", "i2", "i3", "i4"] as const).map((key) => (
            <li key={key}>{t(`communityGuidelines.s1.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="securite" className="pub-legal-section">
        <h2>{t("communityGuidelines.s2.title")}</h2>
        <ul>
          {(["i1", "i2", "i3", "i4"] as const).map((key) => (
            <li key={key}>{t(`communityGuidelines.s2.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="contenu-approprie" className="pub-legal-section">
        <h2>{t("communityGuidelines.s3.title")}</h2>
        <p>{t("communityGuidelines.s3.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4", "i5"] as const).map((key) => (
            <li key={key}>{t(`communityGuidelines.s3.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="collaboration" className="pub-legal-section">
        <h2>{t("communityGuidelines.s4.title")}</h2>
        <ul>
          {(["i1", "i2", "i3", "i4"] as const).map((key) => (
            <li key={key}>{t(`communityGuidelines.s4.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="sanctions" className="pub-legal-section">
        <h2>{t("communityGuidelines.s5.title")}</h2>
        <p>{t("communityGuidelines.s5.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4"] as const).map((key) => (
            <li key={key}>{t(`communityGuidelines.s5.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="signaler" className="pub-legal-section">
        <h2>{t("communityGuidelines.s6.title")}</h2>
        <p>{t("communityGuidelines.s6.intro")}</p>
        <ul>
          <li>{t("communityGuidelines.s6.i1")}</li>
          <li>
            <Trans
              i18nKey="communityGuidelines.s6.i2"
              ns="policies"
              components={{ mail: <a href="mailto:support@campussphere.app" /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="communityGuidelines.s6.i3"
              ns="policies"
              components={{ link: <Link to="/cs/contact" /> }}
            />
          </li>
        </ul>
      </section>

      <section id="contact" className="pub-legal-section">
        <h2>{t("communityGuidelines.s7.title")}</h2>
        <p>{t("communityGuidelines.s7.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="communityGuidelines.s7.email"
              ns="policies"
              components={{ mail: <a href="mailto:policies@campussphere.app" /> }}
            />
          </li>
          <li>{t("communityGuidelines.s7.address")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default CommunityGuidelines;
