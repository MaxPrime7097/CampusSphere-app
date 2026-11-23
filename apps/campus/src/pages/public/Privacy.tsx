import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function Privacy(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "collecte", title: t("privacy.toc.s1") },
      { id: "utilisation", title: t("privacy.toc.s2") },
      { id: "infrastructure", title: t("privacy.toc.s3") },
      { id: "ia-sphera", title: t("privacy.toc.s4") },
      { id: "droits", title: t("privacy.toc.s5") },
      { id: "securite", title: t("privacy.toc.s6") },
      { id: "contact-dpo", title: t("privacy.toc.s7") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("privacy.meta.title")}
      metaDescription={t("privacy.meta.description")}
      canonical="https://campussphere.app/cs/policies/privacy"
      ogTitle={t("privacy.meta.ogTitle")}
      ogDescription={t("privacy.meta.ogDescription")}
      title={t("privacy.header.title")}
      highlight={t("privacy.header.highlight")}
      subtitle={t("privacy.header.subtitle")}
      lastUpdated={t("privacy.header.lastUpdated")}
      currentSlug="/cs/policies/privacy"
      sections={sections}
    >
      <section id="collecte" className="pub-legal-section">
        <h2>{t("privacy.s1.title")}</h2>
        <p>{t("privacy.s1.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4", "i5"] as const).map((key) => (
            <li key={key}>
              <Trans i18nKey={`privacy.s1.${key}`} ns="policies" components={{ strong: <strong /> }} />
            </li>
          ))}
        </ul>
      </section>

      <section id="utilisation" className="pub-legal-section">
        <h2>{t("privacy.s2.title")}</h2>
        <p>{t("privacy.s2.intro")}</p>
        <ul>
          <li>{t("privacy.s2.i1")}</li>
          <li>
            <Trans i18nKey="privacy.s2.i2" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>{t("privacy.s2.i3")}</li>
          <li>{t("privacy.s2.i4")}</li>
        </ul>
      </section>

      <section id="infrastructure" className="pub-legal-section">
        <h2>{t("privacy.s3.title")}</h2>
        <p>{t("privacy.s3.intro")}</p>
        <div className="pub-legal-info-grid">
          {(["b1", "b2", "b3", "b4"] as const).map((key) => (
            <div key={key} className="pub-legal-info-box">
              <h4>{t(`privacy.s3.${key}Title`)}</h4>
              <p>
                <Trans
                  i18nKey={`privacy.s3.${key}Desc`}
                  ns="policies"
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
          ))}
          <div className="pub-legal-info-box">
            <h4>{t("privacy.s3.b5Title")}</h4>
            <p>
              <Trans
                i18nKey="privacy.s3.b5Desc"
                ns="policies"
                components={{ b1: <strong />, b2: <strong />, b3: <strong /> }}
              />
            </p>
          </div>
          <div className="pub-legal-info-box">
            <h4>{t("privacy.s3.b6Title")}</h4>
            <p>
              <Trans
                i18nKey="privacy.s3.b6Desc"
                ns="policies"
                components={{ strong: <strong /> }}
              />
            </p>
          </div>
        </div>
      </section>

      <section id="ia-sphera" className="pub-legal-section">
        <h2>{t("privacy.s4.title")}</h2>
        <p>{t("privacy.s4.intro")}</p>
        <ul>
          <li>{t("privacy.s4.i1")}</li>
          <li>
            <Trans i18nKey="privacy.s4.i2" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>{t("privacy.s4.i3")}</li>
        </ul>
      </section>

      <section id="droits" className="pub-legal-section">
        <h2>{t("privacy.s5.title")}</h2>
        <p>{t("privacy.s5.intro")}</p>
        <ul>
          <li>{t("privacy.s5.i1")}</li>
          <li>{t("privacy.s5.i2")}</li>
          <li>
            <Trans
              i18nKey="privacy.s5.i3"
              ns="policies"
              components={{ link: <Link to="/cs/policies/datadeletion" /> }}
            />
          </li>
          <li>{t("privacy.s5.i4")}</li>
          <li>{t("privacy.s5.i5")}</li>
        </ul>
        <p>
          <Trans
            i18nKey="privacy.s5.outro"
            ns="policies"
            components={{ mail: <a href="mailto:policies@campussphere.app" /> }}
          />
        </p>
      </section>

      <section id="securite" className="pub-legal-section">
        <h2>{t("privacy.s6.title")}</h2>
        <p>{t("privacy.s6.body")}</p>
      </section>

      <section id="contact-dpo" className="pub-legal-section">
        <h2>{t("privacy.s7.title")}</h2>
        <p>{t("privacy.s7.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="privacy.s7.email"
              ns="policies"
              components={{
                m1: <a href="mailto:policies@campussphere.app" />,
                m2: <a href="mailto:support@campussphere.app" />,
              }}
            />
          </li>
          <li>{t("privacy.s7.address")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default Privacy;
