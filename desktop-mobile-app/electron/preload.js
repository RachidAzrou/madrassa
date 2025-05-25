const { contextBridge, ipcRenderer } = require('electron');

try {
  // Controleer of contextIsolation is ingeschakeld
  if (process.contextIsolated) {
    // Gebruik contextBridge als contextIsolation is ingeschakeld
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
  } else {
    // Als contextIsolation is uitgeschakeld, zet de API direct op window
    window.electronAPI = {
      getAppPath: () => ipcRenderer.invoke('get-app-path'),
      getDatabaseConnection: () => ipcRenderer.invoke('get-database-connection'),
      executeQuery: (query, params) => ipcRenderer.invoke('execute-query', query, params),
      readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
      writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
      minimize: () => ipcRenderer.send('minimize'),
      maximize: () => ipcRenderer.send('maximize'),
      close: () => ipcRenderer.send('close'),
      showNotification: (options) => ipcRenderer.invoke('show-notification', options)
    };
  }
} catch (error) {
  console.error('Preload script error:', error);
}