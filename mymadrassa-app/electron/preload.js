const { contextBridge, ipcRenderer } = require('electron');

// Alle beschikbare IPC-kanalen voor communicatie tussen renderer en main process
const validChannels = [
  'get-app-path',
  'get-database-connection',
  'execute-query',
  'read-file',
  'write-file',
  'minimize',
  'maximize',
  'close',
  'show-notification'
];

// Stelt IPC-functies beschikbaar voor de renderer process (web app) via een veilige bridge
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
    },
    send: (channel, ...args) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      } else {
        console.error(`Unauthorized IPC channel: ${channel}`);
      }
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        // Zorg ervoor dat de callback de argumenten ontvangt en converteert naar een array
        const subscription = (event, ...args) => func(...args);
        ipcRenderer.on(channel, subscription);
        
        // Retourneer een unsubscribe functie om later de event listener te verwijderen
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      return () => {}; // Dummy unsubscribe functie voor ongeldige kanalen
    }
  },
  // Voeg hier platformspecifieke functies toe
  platform: process.platform,
  // Versie-informatie
  versions: {
    app: process.env.npm_package_version,
    electron: process.versions.electron,
    node: process.versions.node
  }
});