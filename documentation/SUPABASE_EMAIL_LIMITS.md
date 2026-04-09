# Ajuster les limites d’envoi email Supabase (signup / resend)

## Pourquoi

L’UI applique déjà :

- une détection explicite des erreurs `429` Supabase ;
- un message utilisateur avec délai d’attente ;
- un cooldown local de 60 secondes pour **Renvoyer l’email**.

Si la volumétrie légitime augmente (lancements, campagnes, pics journaliers), il faut également adapter la configuration côté projet Supabase pour éviter des blocages fréquents.

## Où configurer

Dans le dashboard Supabase du projet :

1. Aller sur **Authentication**.
2. Ouvrir les réglages de **Rate limits** / limites d’authentification.
3. Ajuster les quotas liés au flux email (signup, resend, reset password) selon la charge réelle.

> Recommandation : augmenter progressivement, monitorer, puis réajuster.

## Stratégie d’ajustement recommandée

1. **Mesurer** : collecter le volume d’inscriptions et de renvois email par heure/jour.
2. **Identifier les faux positifs** : taux de `429` sur des utilisateurs légitimes.
3. **Ajuster par palier** : ne pas multiplier les limites d’un coup.
4. **Surveiller après changement** :
   - taux d’erreurs `429` ;
   - latence d’envoi email ;
   - taux de conversion inscription → email confirmé.
5. **Conserver la défense anti-abus** : garder cooldown frontend + anti-double-soumission.

## Checklist release

- [ ] Les erreurs `429` sont explicites dans le frontend.
- [ ] Le bouton resend est verrouillé pendant cooldown + requête en cours.
- [ ] Les limites Supabase sont revues avec une justification volumétrique.
- [ ] Les métriques de suivi post-déploiement sont prêtes.
