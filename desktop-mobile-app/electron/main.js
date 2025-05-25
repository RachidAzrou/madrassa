const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const serve = require('electron-serve');

const loadURL = serve({ directory: 'build' });

let mainWindow;

function createWindow() {
  // Maak het browservenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Tijdelijk uitschakelen voor ontwikkeling
    },
  });

  // CSP-instellingen configureren
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* data: blob:"]
      }
    });
  });

  // Laad de juiste URL afhankelijk van development of productie omgeving
  if (isDev) {
    // In development: laad vanaf de dev server
    mainWindow.loadURL('http://localhost:19006');
    // Open de DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In productie: laad vanaf de build directory
    loadURL(mainWindow);
  }

  // Emitted wanneer het venster wordt gesloten
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Deze methode wordt aangeroepen wanneer Electron klaar is
// met initialiseren en vensters kan maken
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Op macOS is het gebruikelijk om een nieuw venster te maken wanneer
    // het dock icon wordt aangeklikt en er geen andere vensters open zijn
    if (mainWindow === null) createWindow();
  });
});

// Afsluiten wanneer alle vensters zijn gesloten, behalve op macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers voor communicatie tussen renderer en main process
ipcMain.handle('get-app-path', () => app.getAppPath());