const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  ping: () => ipcRenderer.invoke("app:ping"),
  reload: () => ipcRenderer.invoke("app:reload"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  setFullscreen: (flag) => ipcRenderer.invoke("window:set-fullscreen", flag),
  isFullscreen: () => ipcRenderer.invoke("window:is-fullscreen"),
  setKiosk: (flag) => ipcRenderer.invoke("window:set-kiosk", flag),
  isKiosk: () => ipcRenderer.invoke("window:is-kiosk"),
  openStudyFiles: () => ipcRenderer.invoke("dialog:open-study-files"),
  openIuLogin: () => ipcRenderer.invoke("academic:open-iu-login"),
  clearSessionCookies: () => ipcRenderer.invoke("auth:clear-cookies")
});

contextBridge.exposeInMainWorld("__uniStudyIU", {
  isAvailable: true,
  loginIU: () => ipcRenderer.invoke("academic:open-iu-login")
});
