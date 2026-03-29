import { contextBridge, ipcRenderer } from "electron";

import { version } from "../../package.json";

contextBridge.exposeInMainWorld("native", {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    desktop: () => version,
  },

  minimise: () => ipcRenderer.send("minimise"),
  maximise: () => ipcRenderer.send("maximise"),
  close: () => ipcRenderer.send("close"),

  setBadgeCount: (count: number) => ipcRenderer.send("setBadgeCount", count),

  // Game activity detection
  onGameActivity: (callback: (game: string | null) => void) => {
    ipcRenderer.on("game-activity-changed", (_event, game: string | null) => {
      callback(game);
    });
  },
  getGameActivity: () => ipcRenderer.sendSync("get-game-activity"),
});
