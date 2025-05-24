const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const serve = require('electron-serve');

const loadURL = serve({ directory: 'web-build' });

let mainWindow;

function createWindow() {
  // Maak het browservenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#f5f7fb',
    title: 'MyMadrassa',
    show: false // We tonen het venster pas na het laden
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

  // Toon het venster wanneer het klaar is met laden
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

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

// Database handlers - later te implementeren
ipcMain.handle('get-database-connection', async () => {
  // In een echte app zou dit een verbinding maken met de lokale database
  return { success: true, message: 'Database verbinding succesvol' };
});

ipcMain.handle('execute-query', async (event, query, params) => {
  // In een echte app zou dit een query uitvoeren op de lokale database
  console.log('Executing query:', query, params);
  return { success: true, data: [] };
});

// Bestandssysteem handlers
ipcMain.handle('read-file', async (event, filePath) => {
  // In een echte app zou dit een bestand lezen
  console.log('Reading file:', filePath);
  return { success: true, data: null };
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  // In een echte app zou dit een bestand schrijven
  console.log('Writing file:', filePath);
  return { success: true };
});

// App window controls
ipcMain.on('minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close', () => {
  if (mainWindow) mainWindow.close();
});

// Notificaties
ipcMain.handle('show-notification', async (event, options) => {
  // In een echte app zou dit een notificatie tonen
  console.log('Showing notification:', options);
  return { success: true };
});