import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function LegalNotice(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "editeur", title: t("legalNotice.toc.s1") },
      { id: "hebergement", title: t("legalNotice.toc.s2") },
      { id: "propriete", title: t("legalNotice.toc.s3") },
      { id: "contact-legal", title: t("legalNotice.toc.s4") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("legalNotice.meta.title")}
      metaDescription={t("legalNotice.meta.description")}
      canonical="https://campussphere.app/cs/policies/legal-notice"
      ogTitle={t("legalNotice.meta.ogTitle")}
      ogDescription={t("legalNotice.meta.ogDescription")}
      title={t("legalNotice.header.title")}
      highlight={t("legalNotice.header.highlight")}
      subtitle={t("legalNotice.header.subtitle")}
      lastUpdated={t("legalNotice.header.lastUpdated")}
      currentSlug="/cs/policies/legal-notice"
      sections={sections}
    >
      <section id="editeur" className="pub-legal-section">
        <h2>{t("legalNotice.s1.title")}</h2>
        <p>
          <Trans
            i18nKey="legalNotice.s1.intro"
            ns="policies"
            components={{
              b1: <strong />,
              b2: <strong />,
              c1: <code />,
              c2: <code />,
            }}
          />
        </p>
        <ul>
          <li>
            <Trans i18nKey="legalNotice.s1.i1" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans i18nKey="legalNotice.s1.i2" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans
              i18nKey="legalNotice.s1.i3"
              ns="policies"
              components={{
                strong: <strong />,
                mail: <a href="mailto:contact@campussphere.app" />,
              }}
            />
          </li>
          <li>
            <Trans
              i18nKey="legalNotice.s1.i4"
              ns="policies"
              components={{
                strong: <strong />,
                mail: <a href="mailto:support@campussphere.app" />,
              }}
            />
          </li>
          <li>
            <Trans
              i18nKey="legalNotice.s1.i5"
              ns="policies"
              components={{
                strong: <strong />,
                mail: <a href="mailto:policies@campussphere.app" />,
              }}
            />
          </li>
          <li>
            <Trans i18nKey="legalNotice.s1.i6" ns="policies" components={{ strong: <strong /> }} />
          </li>
        </ul>
      </section>

      <section id="hebergement" className="pub-legal-section">
        <h2>{t("legalNotice.s2.title")}</h2>
        <p>{t("legalNotice.s2.intro")}</p>
        <div className="pub-legal-info-grid">
          {(["b1", "b2", "b3", "b4"] as const).map((key) => (
            <div key={key} className="pub-legal-info-box">
              <h4>{t(`legalNotice.s2.${key}Title`)}</h4>
              <p>
                <Trans
                  i18nKey={`legalNotice.s2.${key}Desc`}
                  ns="policies"
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
          ))}
          <div className="pub-legal-info-box">
            <h4>{t("legalNotice.s2.b5Title")}</h4>
            <p>
              <Trans
                i18nKey="legalNotice.s2.b5Desc"
                ns="policies"
                components={{ b1: <strong />, b2: <strong />, b3: <strong /> }}
              />
            </p>
          </div>
        </div>
      </section>

      <section id="propriete" className="pub-legal-section">
        <h2>{t("legalNotice.s3.title")}</h2>
        <p>{t("legalNotice.s3.p1")}</p>
        <p>{t("legalNotice.s3.p2")}</p>
      </section>

      <section id="contact-legal" className="pub-legal-section">
        <h2>{t("legalNotice.s4.title")}</h2>
        <p>{t("legalNotice.s4.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="legalNotice.s4.email"
              ns="policies"
              components={{
                m1: <a href="mailto:policies@campussphere.app" />,
                m2: <a href="mailto:support@campussphere.app" />,
              }}
            />
          </li>
          <li>{t("legalNotice.s4.location")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default LegalNotice;
