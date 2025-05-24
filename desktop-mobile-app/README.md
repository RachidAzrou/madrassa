# MyMadrassa Desktop App

Deze app is de desktop versie van de MyMadrassa educatie management platform. Het is gebouwd met Electron, React Native en Expo.

## Vereisten

- Node.js (14.x of hoger)
- npm (6.x of hoger)
- Expo CLI (`npm install -g expo-cli`)

## Installatie

1. Installeer alle afhankelijkheden:
   ```
   npm install
   ```

## Ontwikkeling

Om de applicatie te starten in ontwikkelingsmodus:

1. Start de Expo webserver:
   ```
   npm run web
   ```

2. In een aparte terminal, start de Electron app:
   ```
   npm run electron
   ```

Of gebruik de gecombineerde ontwikkelomgeving:

```
npm run electron-dev
```

## Bouwen voor productie

Om een distributie te bouwen voor verschillende platforms:

```
npm run build:electron
```

Dit zal de app bouwen voor het platform waarop je het uitvoert (Windows, macOS, of Linux).

## Projectstructuur

- `/electron` - Electron configuratie en main process code
- `/src` - React Native applicatiecode
  - `/components` - Herbruikbare UI componenten
  - `/screens` - App schermen
  - `/navigation` - Navigatie configuratie
  - `/services` - API en andere services
  - `/store` - State management