const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Maak het browservenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Laad de app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in ontwikkelmodus
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers voor communicatie met renderer process
ipcMain.handle('get-app-info', () => {
  return {
    appName: 'MyMadrassa Desktop',
    version: app.getVersion(),
    electronVersion: process.versions.electron
  };
});

// Database connectie handler (simulatie)
ipcMain.handle('get-database-connection', async () => {
  return { success: true, message: 'Database verbinding succesvol' };
});

// Voorbeeld query handler
ipcMain.handle('execute-query', async (event, query, params) => {
  console.log('Query uitgevoerd:', query, params);
  
  // Simuleer een antwoord (in een echte app zou dit verbinding maken met een database)
  if (query.includes('students')) {
    return {
      success: true,
      data: [
        { id: 1, name: 'Ahmed Youssef', grade: '8A' },
        { id: 2, name: 'Fatima El Amrani', grade: '7B' },
        { id: 3, name: 'Mohammed Ouahbi', grade: '9C' }
      ]
    };
  }
  
  if (query.includes('teachers')) {
    return {
      success: true,
      data: [
        { id: 1, name: 'Dr. Ibrahim Najjar', subject: 'Arabisch' },
        { id: 2, name: 'Aisha Benali', subject: 'Islamitische Studies' }
      ]
    };
  }
  
  return { success: true, data: [] };
});