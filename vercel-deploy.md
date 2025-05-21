# Deployen op Vercel met Neon Database

## Voorbereidingen

1. **Maak een nieuw GitHub repository**
   - Push je code naar GitHub

2. **Pas de Vercel configuratie aan**
   - Maak een bestand aan genaamd `vercel.json` in de root van je project met de volgende inhoud:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Vercel Deployment Stappen

1. **Log in op Vercel**
   - Ga naar [vercel.com](https://vercel.com) en log in met je account

2. **Import Repository**
   - Klik op "Add New" en selecteer "Project"
   - Connect je GitHub repository
   - Configure project instellingen:
     - Framework Preset: Other
     - Root Directory: ./
     - Build Command: npm run build
     - Output Directory: dist

3. **Environment Variables**
   - Voeg `DATABASE_URL` toe met je Madrassa DB connectiestring
   - Voeg eventuele andere benodigde environment variables toe

4. **Deploy**
   - Klik op "Deploy" om je project te deployen

## After Deployment

1. **Controleer functioneren**
   - Test je applicatie op de gegenereerde Vercel URL
   - Controleer of alle routes en API endpoints werken

2. **Custom Domain (Optioneel)**
   - In Project Settings > Domains, kun je een eigen domein toevoegen

## Oplossen van veelvoorkomende problemen

- **Database Connectie Problemen**:
  Controleer of je DATABASE_URL correct is in de environment variables

- **API Routes werken niet**:
  Controleer of je API routes correct zijn opgezet in de vercel.json

## Tips voor optimale prestaties

- Vercel CDN cached automatisch statische bestanden
- Voor dynamische routes, overweeg Edge Functions te gebruiken
- Gebruik Neon's connection pooling voor betere database prestaties