import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function Copyright(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "respect-pi", title: t("copyright.toc.s1") },
      { id: "signaler-violation", title: t("copyright.toc.s2") },
      { id: "notification", title: t("copyright.toc.s3") },
      { id: "contre-notification", title: t("copyright.toc.s4") },
      { id: "recidive", title: t("copyright.toc.s5") },
      { id: "contenu-utilisateurs", title: t("copyright.toc.s6") },
      { id: "contact", title: t("copyright.toc.s7") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("copyright.meta.title")}
      metaDescription={t("copyright.meta.description")}
      canonical="https://campussphere.app/cs/policies/copyright"
      ogTitle={t("copyright.meta.ogTitle")}
      ogDescription={t("copyright.meta.ogDescription")}
      title={t("copyright.header.title")}
      highlight={t("copyright.header.highlight")}
      subtitle={t("copyright.header.subtitle")}
      lastUpdated={t("copyright.header.lastUpdated")}
      currentSlug="/cs/policies/copyright"
      sections={sections}
    >
      <section id="respect-pi" className="pub-legal-section">
        <h2>{t("copyright.s1.title")}</h2>
        <p>{t("copyright.s1.body")}</p>
      </section>

      <section id="signaler-violation" className="pub-legal-section">
        <h2>{t("copyright.s2.title")}</h2>
        <p>{t("copyright.s2.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4", "i5", "i6"] as const).map((key) => (
            <li key={key}>{t(`copyright.s2.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="notification" className="pub-legal-section">
        <h2>{t("copyright.s3.title")}</h2>
        <p>{t("copyright.s3.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="copyright.s3.email"
              ns="policies"
              components={{ mail: <a href="mailto:policies@campussphere.app" /> }}
            />
          </li>
          <li>{t("copyright.s3.address")}</li>
        </ul>
      </section>

      <section id="contre-notification" className="pub-legal-section">
        <h2>{t("copyright.s4.title")}</h2>
        <p>{t("copyright.s4.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4"] as const).map((key) => (
            <li key={key}>{t(`copyright.s4.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="recidive" className="pub-legal-section">
        <h2>{t("copyright.s5.title")}</h2>
        <p>{t("copyright.s5.body")}</p>
      </section>

      <section id="contenu-utilisateurs" className="pub-legal-section">
        <h2>{t("copyright.s6.title")}</h2>
        <p>{t("copyright.s6.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4"] as const).map((key) => (
            <li key={key}>{t(`copyright.s6.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="contact" className="pub-legal-section">
        <h2>{t("copyright.s7.title")}</h2>
        <p>{t("copyright.s7.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="copyright.s7.email"
              ns="policies"
              components={{ mail: <a href="mailto:policies@campussphere.app" /> }}
            />
          </li>
          <li>{t("copyright.s7.address")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default Copyright;
