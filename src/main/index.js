const { app, BrowserWindow, WebContentsView, ipcMain, shell, session } = require('electron');
const fs = require('fs');
const path = require('path');

const YT_MUSIC_URL = 'https://music.youtube.com';
const TITLEBAR_HEIGHT = 40; // keep in sync with --cutesy-titlebar-height in shell.html

// Google blocks OAuth from embedded Chromium ("this browser may not be secure"),
// even with a clean Chrome UA. Presenting a Firefox UA to Google's auth domains
// sidesteps that fingerprinting; everything else keeps the Chrome UA so YT Music
// behaves normally.
const GOOGLE_AUTH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
const GOOGLE_AUTH_HOSTS =
  /(^|\.)(accounts\.google\.com|accounts\.youtube\.com|accounts\.google\.[a-z.]+)$/i;

function installGoogleLoginFix() {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    try {
      const host = new URL(details.url).hostname;
      if (GOOGLE_AUTH_HOSTS.test(host)) {
        details.requestHeaders['User-Agent'] = GOOGLE_AUTH_UA;
      }
    } catch {
      /* ignore non-standard URLs */
    }
    callback({ requestHeaders: details.requestHeaders });
  });
}

const RENDERER_DIR = path.join(__dirname, '..', 'renderer');
const pastelCss = fs.readFileSync(path.join(RENDERER_DIR, 'pastel.css'), 'utf8');

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {WebContentsView | null} */
let musicView = null;

// Position the YouTube Music view to fill everything below our title bar.
function layoutMusicView() {
  if (!mainWindow || !musicView) return;
  const { width, height } = mainWindow.getContentBounds();
  musicView.setBounds({
    x: 0,
    y: TITLEBAR_HEIGHT,
    width,
    height: Math.max(0, height - TITLEBAR_HEIGHT),
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // frameless — our shell draws the title bar
    backgroundColor: '#fff0f6', // pastel pink, avoids white flash on load
    title: 'Cutesy YouTube Music',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Our own local shell page owns the title bar (drag + window buttons).
  mainWindow.loadFile(path.join(RENDERER_DIR, 'shell.html'));

  // The real YouTube Music site lives in a child view below the title bar.
  musicView = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.contentView.addChildView(musicView);
  layoutMusicView();

  const view = musicView.webContents;

  // Some Google endpoints reject the default Electron user agent. Present as
  // a normal desktop Chrome browser.
  const ua = view.userAgent
    .replace(/Electron\/[\d.]+\s*/i, '')
    .replace(/cutesy-youtube-music\/[\d.]+\s*/i, '');
  view.setUserAgent(ua);

  view.loadURL(YT_MUSIC_URL, { userAgent: ua });

  // Re-apply the pastel theme on every load so it survives YT Music's
  // single-page-app routing and full reloads.
  view.on('did-finish-load', () => {
    view.insertCSS(pastelCss);
  });

  // Allow YouTube/Google (incl. the login flow) to open in-app; send genuinely
  // external links to the system browser.
  view.setWindowOpenHandler(({ url }) => {
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      /* fall through to external */
    }
    const internal =
      /(^|\.)(youtube\.com|google\.com|googleusercontent\.com|gstatic\.com)$/i.test(host);
    if (internal) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('resize', layoutMusicView);
  mainWindow.on('maximize', layoutMusicView);
  mainWindow.on('unmaximize', layoutMusicView);

  // Let the shell update its maximize button glyph.
  const sendMaxState = () =>
    mainWindow?.webContents.send('window:maximized', mainWindow.isMaximized());
  mainWindow.on('maximize', sendMaxState);
  mainWindow.on('unmaximize', sendMaxState);

  mainWindow.on('closed', () => {
    mainWindow = null;
    musicView = null;
  });
}

// Forward custom title-bar button clicks to real window actions.
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// Single-instance: focus the existing window instead of opening a second app.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    installGoogleLoginFix();
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
