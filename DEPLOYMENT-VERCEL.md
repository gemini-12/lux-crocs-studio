# Déploiement sur Vercel (backend Lovable Cloud conservé)

Architecture finale :

```
Vercel  →  Application (SSR + routes API)  →  Lovable Cloud (base de données + stockage images)
```

Rien n'a changé côté design, animations ou fonctionnalités. Seule la façon dont
le serveur parle au backend a été adaptée pour qu'aucune clé secrète ne soit
nécessaire.

## Ce qui a changé techniquement

| Avant | Maintenant |
| --- | --- |
| Tout passait par `SUPABASE_SERVICE_ROLE_KEY` (indisponible hors Lovable → erreur 500) | Plus aucune dépendance à cette clé |
| Lecture publique via clé secrète | Lecture via la clé publique + règles d'accès (RLS) |
| Écriture admin via clé secrète | Écriture via un compte administrateur backend (email + mot de passe, **serveur uniquement**) |
| Images lues via clé secrète | Images servies par `/images/*` avec la clé publique |

Les produits, images, tailles, prix, statuts, ordre, galeries, le bouton
WhatsApp et le panneau `/admin` (mot de passe `simo123`) fonctionnent à
l'identique.

## Étapes de déploiement

1. Pousser le projet sur GitHub, puis « Import Project » sur Vercel.
2. Framework preset : **Other**. Build command : `npm run build`
   (le build génère automatiquement la sortie Vercel).
3. Ajouter les variables d'environnement (voir `.env.example`) :

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `ADMIN_SUPABASE_EMAIL`
   - `ADMIN_SUPABASE_PASSWORD`
   - `ADMIN_PASSWORD` (facultatif, défaut `simo123`)
   - `ADMIN_SESSION_SECRET` (chaîne aléatoire de 32+ caractères)

   ⚠️ `ADMIN_SUPABASE_EMAIL`, `ADMIN_SUPABASE_PASSWORD`, `ADMIN_PASSWORD` et
   `ADMIN_SESSION_SECRET` ne doivent **jamais** porter le préfixe `VITE_` :
   elles resteraient alors exposées au navigateur.

4. Déployer. Aucune donnée n'est perdue : la base et les images restent dans
   Lovable Cloud et survivent à tous les redeploys.

## Notes

- Aucun stockage sur le système de fichiers : les images vivent dans le
  stockage du backend.
- Le même backend sert la version Lovable et la version Vercel : les produits
  ajoutés depuis l'une apparaissent immédiatement sur l'autre.
