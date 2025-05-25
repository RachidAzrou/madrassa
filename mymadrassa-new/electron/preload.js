const { contextBridge, ipcRenderer } = require('electron');

// Veilige brug tussen renderer process en main process
contextBridge.exposeInMainWorld('electronAPI', {
  // App informatie
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Database functionaliteit
  getDatabaseConnection: () => ipcRenderer.invoke('get-database-connection'),
  executeQuery: (query, params) => ipcRenderer.invoke('execute-query', query, params),
  
  // Overige functionaliteit kan hier worden toegevoegd
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});