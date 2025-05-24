const { contextBridge, ipcRenderer } = require('electron');

// Expose beschermde methoden die toegang bieden tot Node.js functionaliteit
// via het window.api object
contextBridge.exposeInMainWorld('electronAPI', {
  // Hier kunnen we veilige functies toevoegen die communiceren met de main process
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  // Database gerelateerde functies
  getDatabaseConnection: () => ipcRenderer.invoke('get-database-connection'),
  executeQuery: (query, params) => ipcRenderer.invoke('execute-query', query, params),
  // Bestandssysteem operaties
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  // Applicatie functies
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  // Notificaties
  showNotification: (options) => ipcRenderer.invoke('show-notification', options)
});