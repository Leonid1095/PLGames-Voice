import { NativeImage, app, ipcMain, nativeImage } from "electron";

import { mainWindow } from "./window";

// internal state
const nativeIcons: Record<number, NativeImage> = {};

export async function setBadgeCount(count: number) {
  switch (process.platform) {
    case "win32":
    case "linux":
      if (count === 0) {
        mainWindow.setOverlayIcon(null, "No Notifications");
        break;
      }

      if (!nativeIcons[count])
        nativeIcons[count] = nativeImage.createFromDataURL(
          await import(
            `../../assets/desktop/badges/${Math.min(count, 10)}.ico?asset`
          ).then((asset) => asset.default),
        );

      mainWindow.setOverlayIcon(
        nativeIcons[count],
        count === -1 ? `Unread Messages` : `${count} Notifications`,
      );

      break;
    case "darwin":
      app.dock.setBadge(
        count === -1 ? "•" : count === 0 ? "" : count.toString(),
      );

      break;
  }
}

ipcMain.on("setBadgeCount", (_event, count: unknown) => {
  if (typeof count !== "number" || !Number.isInteger(count) || count < -1) return;
  setBadgeCount(count);
});
