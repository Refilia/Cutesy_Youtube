const { contextBridge, ipcRenderer } = require('electron');

// Exposed to our local shell page (shell.html), which draws the title bar.
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  // Notifies the shell when the window is (un)maximized so it can swap the glyph.
  onMaximizedChange: (cb) =>
    ipcRenderer.on('window:maximized', (_event, isMax) => cb(isMax)),
});
