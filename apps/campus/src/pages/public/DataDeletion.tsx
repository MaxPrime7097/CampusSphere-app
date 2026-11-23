import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export function DataDeletion(): JSX.Element {
  const { t, i18n } = useTranslation("policies");

  const sections = useMemo(
    () => [
      { id: "droit-effacement", title: t("dataDeletion.toc.s1") },
      { id: "procedure", title: t("dataDeletion.toc.s2") },
      { id: "donnees-supprimees", title: t("dataDeletion.toc.s3") },
      { id: "sauvegardes", title: t("dataDeletion.toc.s4") },
      { id: "contact", title: t("dataDeletion.toc.s5") },
    ],
    [t, i18n.language]
  );

  return (
    <PolicyLayout
      metaTitle={t("dataDeletion.meta.title")}
      metaDescription={t("dataDeletion.meta.description")}
      canonical="https://campussphere.app/cs/policies/datadeletion"
      ogTitle={t("dataDeletion.meta.ogTitle")}
      ogDescription={t("dataDeletion.meta.ogDescription")}
      title={t("dataDeletion.header.title")}
      highlight={t("dataDeletion.header.highlight")}
      subtitle={t("dataDeletion.header.subtitle")}
      lastUpdated={t("dataDeletion.header.lastUpdated")}
      currentSlug="/cs/policies/datadeletion"
      sections={sections}
    >
      <section id="droit-effacement" className="pub-legal-section">
        <h2>{t("dataDeletion.s1.title")}</h2>
        <p>{t("dataDeletion.s1.p1")}</p>
        <p>{t("dataDeletion.s1.p2")}</p>
      </section>

      <section id="procedure" className="pub-legal-section">
        <h2>{t("dataDeletion.s2.title")}</h2>
        <p>{t("dataDeletion.s2.intro")}</p>
        <ol>
          <li>
            <Trans
              i18nKey="dataDeletion.s2.step1"
              ns="policies"
              components={{ strong: <strong /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="dataDeletion.s2.step2"
              ns="policies"
              components={{ b1: <strong />, b2: <strong /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="dataDeletion.s2.step3"
              ns="policies"
              components={{ strong: <strong /> }}
            />
          </li>
          <li>{t("dataDeletion.s2.step4")}</li>
        </ol>
        <div className="pub-legal-callout">
          <Trans
            i18nKey="dataDeletion.s2.callout"
            ns="policies"
            components={{ mail: <a href="mailto:policies@campussphere.app" /> }}
          />
        </div>
      </section>

      <section id="donnees-supprimees" className="pub-legal-section">
        <h2>{t("dataDeletion.s3.title")}</h2>
        <p>{t("dataDeletion.s3.intro")}</p>
        <ul>
          {(["i1", "i2", "i3", "i4", "i5"] as const).map((key) => (
            <li key={key}>{t(`dataDeletion.s3.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section id="sauvegardes" className="pub-legal-section">
        <h2>{t("dataDeletion.s4.title")}</h2>
        <p>{t("dataDeletion.s4.intro")}</p>
        <ul>
          <li>
            <Trans i18nKey="dataDeletion.s4.i1" ns="policies" components={{ strong: <strong /> }} />
          </li>
          <li>
            <Trans i18nKey="dataDeletion.s4.i2" ns="policies" components={{ strong: <strong /> }} />
          </li>
        </ul>
      </section>

      <section id="contact" className="pub-legal-section">
        <h2>{t("dataDeletion.s5.title")}</h2>
        <p>{t("dataDeletion.s5.intro")}</p>
        <ul>
          <li>
            <Trans
              i18nKey="dataDeletion.s5.i1"
              ns="policies"
              components={{ mail: <a href="mailto:policies@campussphere.app" /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="dataDeletion.s5.i2"
              ns="policies"
              components={{ mail: <a href="mailto:support@campussphere.app" /> }}
            />
          </li>
          <li>{t("dataDeletion.s5.i3")}</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}

export default DataDeletion;
