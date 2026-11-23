import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function CookiePolicy(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "definition", title: t("cookiePolicy.toc.s1") },
      { id: "types", title: t("cookiePolicy.toc.s2") },
      { id: "gestion", title: t("cookiePolicy.toc.s3") },
      { id: "contact", title: t("cookiePolicy.toc.s4") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("cookiePolicy.meta.title")}
      metaDescription={t("cookiePolicy.meta.description")}
      canonical="https://campussphere.app/cs/policies/cookiepolicy"
      ogTitle={t("cookiePolicy.meta.ogTitle")}
      ogDescription={t("cookiePolicy.meta.ogDescription")}
      title={t("cookiePolicy.header.title")}
      highlight={t("cookiePolicy.header.highlight")}
      subtitle={t("cookiePolicy.header.subtitle")}
      lastUpdated={t("cookiePolicy.header.lastUpdated")}
      currentSlug="/cs/policies/cookiepolicy"
      sections={sections}
    >
      <section id="definition" className="pub-legal-section">
        <h2>{t("cookiePolicy.s1.title")}</h2>
        <p>{t("cookiePolicy.s1.body")}</p>
      </section>

      <section id="types" className="pub-legal-section">
        <h2>{t("cookiePolicy.s2.title")}</h2>
        <div className="pub-legal-info-grid">
          <div className="pub-legal-info-box">
            <h4>{t("cookiePolicy.s2.b1Title")}</h4>
            <p>{t("cookiePolicy.s2.b1Desc")}</p>
          </div>
          <div className="pub-legal-info-box">
            <h4>{t("cookiePolicy.s2.b2Title")}</h4>
            <p>{t("cookiePolicy.s2.b2Desc")}</p>
          </div>
        </div>
        <div className="pub-legal-callout">
          <Trans
            i18nKey="cookiePolicy.s2.callout"
            ns="policies"
            components={{ strong: <strong /> }}
          />
        </div>
      </section>

      <section id="gestion" className="pub-legal-section">
        <h2>{t("cookiePolicy.s3.title")}</h2>
        <p>{t("cookiePolicy.s3.p1")}</p>
        <p>{t("cookiePolicy.s3.p2")}</p>
      </section>

      <section id="contact" className="pub-legal-section">
        <h2>{t("cookiePolicy.s4.title")}</h2>
        <p>{t("cookiePolicy.s4.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="cookiePolicy.s4.email"
              ns="policies"
              components={{
                m1: <a href="mailto:policies@campussphere.app" />,
                m2: <a href="mailto:support@campussphere.app" />,
              }}
            />
          </li>
          <li>{t("cookiePolicy.s4.address")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default CookiePolicy;
