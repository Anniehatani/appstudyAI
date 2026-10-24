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
  openIuLogin: () => ipcRenderer.invoke("academic:open-iu-login")
});

contextBridge.exposeInMainWorld("__uniStudyIU", {
  isAvailable: true,
  loginIU: () => ipcRenderer.invoke("academic:open-iu-login")
});
