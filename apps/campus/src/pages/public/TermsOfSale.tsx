import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function TermsOfSale(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "champ", title: t("termsOfSale.toc.s1") },
      { id: "services-tarifs", title: t("termsOfSale.toc.s2") },
      { id: "paiement-campay", title: t("termsOfSale.toc.s3") },
      { id: "retractation", title: t("termsOfSale.toc.s4") },
      { id: "remboursement", title: t("termsOfSale.toc.s5") },
      { id: "litiges", title: t("termsOfSale.toc.s6") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("termsOfSale.meta.title")}
      metaDescription={t("termsOfSale.meta.description")}
      canonical="https://campussphere.app/cs/policies/terms-of-sale"
      ogTitle={t("termsOfSale.meta.ogTitle")}
      ogDescription={t("termsOfSale.meta.ogDescription")}
      title={t("termsOfSale.header.title")}
      highlight={t("termsOfSale.header.highlight")}
      subtitle={t("termsOfSale.header.subtitle")}
      lastUpdated={t("termsOfSale.header.lastUpdated")}
      currentSlug="/cs/policies/terms-of-sale"
      sections={sections}
    >
      <section id="champ" className="pub-legal-section">
        <h2>{t("termsOfSale.s1.title")}</h2>
        <p>
          <Trans
            i18nKey="termsOfSale.s1.p1"
            ns="policies"
            components={{ b1: <strong />, b2: <strong /> }}
          />
        </p>
        <p>
          <Trans i18nKey="termsOfSale.s1.p2" ns="policies" components={{ strong: <strong /> }} />
        </p>
      </section>

      <section id="services-tarifs" className="pub-legal-section">
        <h2>{t("termsOfSale.s2.title")}</h2>
        <p>{t("termsOfSale.s2.p1")}</p>
        <ul>
          {(["i1", "i2", "i3"] as const).map((key) => (
            <li key={key}>
              <Trans
                i18nKey={`termsOfSale.s2.${key}`}
                ns="policies"
                components={{ strong: <strong /> }}
              />
            </li>
          ))}
        </ul>
        <p>
          <Trans i18nKey="termsOfSale.s2.p2" ns="policies" components={{ strong: <strong /> }} />
        </p>
      </section>

      <section id="paiement-campay" className="pub-legal-section">
        <h2>{t("termsOfSale.s3.title")}</h2>
        <p>
          <Trans i18nKey="termsOfSale.s3.p1" ns="policies" components={{ strong: <strong /> }} />
        </p>
        <ul>
          <li>
            <Trans i18nKey="termsOfSale.s3.i1" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans i18nKey="termsOfSale.s3.i2" ns="policies" components={{ strong: <strong /> }} />
          </li>
        </ul>
        <p>{t("termsOfSale.s3.p2")}</p>
      </section>

      <section id="retractation" className="pub-legal-section">
        <h2>{t("termsOfSale.s4.title")}</h2>
        <p>{t("termsOfSale.s4.p1")}</p>
        <div className="pub-legal-callout">{t("termsOfSale.s4.callout")}</div>
      </section>

      <section id="remboursement" className="pub-legal-section">
        <h2>{t("termsOfSale.s5.title")}</h2>
        <p>{t("termsOfSale.s5.p1")}</p>
        <p>{t("termsOfSale.s5.p2")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="termsOfSale.s5.i1"
              ns="policies"
              components={{
                m1: <a href="mailto:support@campussphere.app" />,
                m2: <a href="mailto:policies@campussphere.app" />,
              }}
            />
          </li>
          <li>{t("termsOfSale.s5.i2")}</li>
        </ul>
      </section>

      <section id="litiges" className="pub-legal-section">
        <h2>{t("termsOfSale.s6.title")}</h2>
        <p>{t("termsOfSale.s6.p1")}</p>
        <p>{t("termsOfSale.s6.p2")}</p>
      </section>
    </PolicyLayout>
  );
}

export default TermsOfSale;
