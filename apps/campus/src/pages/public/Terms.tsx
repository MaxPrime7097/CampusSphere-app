import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function Terms(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "acceptation", title: t("terms.toc.s1") },
      { id: "age-restriction", title: t("terms.toc.s2") },
      { id: "utilisation", title: t("terms.toc.s3") },
      { id: "contenu-utilisateur", title: t("terms.toc.s4") },
      { id: "paiements", title: t("terms.toc.s5") },
      { id: "interdictions", title: t("terms.toc.s6") },
      { id: "propriete-intellectuelle", title: t("terms.toc.s7") },
      { id: "responsabilite", title: t("terms.toc.s8") },
      { id: "contact", title: t("terms.toc.s9") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("terms.meta.title")}
      metaDescription={t("terms.meta.description")}
      canonical="https://campussphere.app/cs/policies/terms"
      ogTitle={t("terms.meta.ogTitle")}
      ogDescription={t("terms.meta.ogDescription")}
      title={t("terms.header.title")}
      highlight={t("terms.header.highlight")}
      subtitle={t("terms.header.subtitle")}
      lastUpdated={t("terms.header.lastUpdated")}
      currentSlug="/cs/policies/terms"
      sections={sections}
    >
      <section id="acceptation" className="pub-legal-section">
        <h2>{t("terms.s1.title")}</h2>
        <p>{t("terms.s1.body")}</p>
      </section>

      <section id="age-restriction" className="pub-legal-section">
        <h2>{t("terms.s2.title")}</h2>
        <ul>
          <li>
            <Trans
              i18nKey="terms.s2.i1"
              ns="policies"
              components={{ b1: <strong />, b2: <strong /> }}
            />
          </li>
          <li>{t("terms.s2.i2")}</li>
          <li>{t("terms.s2.i3")}</li>
          <li>{t("terms.s2.i4")}</li>
          <li>{t("terms.s2.i5")}</li>
          <li>{t("terms.s2.i6")}</li>
        </ul>
      </section>

      <section id="utilisation" className="pub-legal-section">
        <h2>{t("terms.s3.title")}</h2>
        <p>{t("terms.s3.intro")}</p>
        <ul>
          <li>{t("terms.s3.i1")}</li>
          <li>{t("terms.s3.i2")}</li>
          <li>{t("terms.s3.i3")}</li>
          <li>{t("terms.s3.i4")}</li>
          <li>{t("terms.s3.i5")}</li>
        </ul>
        <p>
          <Trans i18nKey="terms.s3.spheraNote" ns="policies" components={{ strong: <strong /> }} />
        </p>
      </section>

      <section id="contenu-utilisateur" className="pub-legal-section">
        <h2>{t("terms.s4.title")}</h2>
        <p>{t("terms.s4.intro")}</p>
        <ul>
          <li>
            <Trans i18nKey="terms.s4.i1" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans i18nKey="terms.s4.i2" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans i18nKey="terms.s4.i3" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>{t("terms.s4.i4")}</li>
        </ul>
      </section>

      <section id="paiements" className="pub-legal-section">
        <h2>{t("terms.s5.title")}</h2>
        <p>{t("terms.s5.intro")}</p>
        <ul>
          <li>
            <Trans i18nKey="terms.s5.i1" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans
              i18nKey="terms.s5.i2"
              ns="policies"
              components={{ link: <Link to="/cs/policies/terms-of-sale" /> }}
            />
          </li>
        </ul>
      </section>

      <section id="interdictions" className="pub-legal-section">
        <h2>{t("terms.s6.title")}</h2>
        <p>{t("terms.s6.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4", "i5", "i6", "i7"] as const).map((key) => (
            <li key={key}>{t(`terms.s6.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="propriete-intellectuelle" className="pub-legal-section">
        <h2>{t("terms.s7.title")}</h2>
        <p>{t("terms.s7.body")}</p>
      </section>

      <section id="responsabilite" className="pub-legal-section">
        <h2>{t("terms.s8.title")}</h2>
        {(["p1", "p2", "p3"] as const).map((key) => (
          <p key={key}>
            <Trans i18nKey={`terms.s8.${key}`} ns="policies" components={{ strong: <strong /> }} />
          </p>
        ))}
      </section>

      <section id="contact" className="pub-legal-section">
        <h2>{t("terms.s9.title")}</h2>
        <p>{t("terms.s9.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="terms.s9.email"
              ns="policies"
              components={{
                m1: <a href="mailto:policies@campussphere.app" />,
                m2: <a href="mailto:support@campussphere.app" />,
              }}
            />
          </li>
          <li>{t("terms.s9.address")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default Terms;
