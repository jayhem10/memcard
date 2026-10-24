This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# memcard

## Mise à jour des prix eBay

Depuis l'administration, la mise à jour parcourt les jeux par pages de 100 et
traite au maximum 3 jeux par requête. Seuls les jeux sans prix exploitables ou
dont les prix datent de plus de 7 jours sont ciblés. Le navigateur enchaîne les
lots et affiche la progression : gardez la page ouverte jusqu'au bilan final.

Chaque recherche de prix est limitée à 20 secondes, OAuth et recherches de
repli inclus. La route déclare `maxDuration = 60` ; l'hébergement doit autoriser
cette durée. Les erreurs par jeu figurent dans le bilan et les logs serveur.
Une réponse non JSON de l'hébergeur est signalée avec son statut HTTP, sans
masquer l'erreur par une erreur de parsing JSON. Les prix déjà enregistrés
restent conservés en cas d'interruption.

Tests ciblés : `node --test tests/update-prices.test.cjs`.
