import { IUpdateInfo, updateElectronApp } from "update-electron-app";

import { BrowserWindow, Notification, app, ipcMain, session, shell } from "electron";
import started from "electron-squirrel-startup";

import { autoLaunch } from "./native/autoLaunch";
import { config } from "./native/config";
import { initDiscordRpc } from "./native/discordRpc";
import { getCurrentGame, startGameDetector } from "./native/gameDetector";
import { initTray } from "./native/tray";
import { BUILD_URL, createMainWindow, mainWindow } from "./native/window";

// Squirrel-specific logic
// create/remove shortcuts on Windows when installing / uninstalling
// we just need to close out of the app immediately
if (started) {
  app.quit();
}

// disable hw-accel if so requested
if (!config.hardwareAcceleration) {
  app.disableHardwareAcceleration();
}

// ensure only one copy of the application can run
const acquiredLock = app.requestSingleInstanceLock();

const onNotifyUser = (_info: IUpdateInfo) => {
  const notification = new Notification({
    title: "Доступно обновление",
    body: "Перезапустите приложение, чтобы установить обновление.",
    silent: true,
  });

  notification.show();
};

if (acquiredLock) {
  // start auto update logic — use static storage pointing to GitHub Releases
  // (update.electronjs.org proxy doesn't index all repos)
  updateElectronApp({
    onNotifyUser,
    updateSource: {
      type: "static-storage",
      baseUrl: "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download",
    },
  });

  // create and configure the app when electron is ready
  app.on("ready", () => {
    // Content Security Policy — защита от XSS
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            [
              "default-src 'self'",
              `script-src 'self'`,
              `style-src 'self' 'unsafe-inline'`,
              `img-src 'self' ${BUILD_URL.origin} data: blob:`,
              `connect-src 'self' ${BUILD_URL.origin} wss://${BUILD_URL.hostname}`,
              `font-src 'self' ${BUILD_URL.origin}`,
              `media-src 'self' blob:`,
            ].join("; "),
          ],
        },
      });
    });

    // create window and application contexts
    createMainWindow();

    // enable auto start on Windows and MacOS
    if (config.firstLaunch) {
      if (process.platform === "win32" || process.platform === "darwin") {
        autoLaunch.enable();
      }
      config.firstLaunch = false;
    }

    initTray();
    initDiscordRpc();

    // Game activity detection
    ipcMain.on("get-game-activity", (event) => {
      event.returnValue = getCurrentGame();
    });
    if (config.gameDetection) {
      startGameDetector();
    }

    // Windows specific fix for notifications
    if (process.platform === "win32") {
      app.setAppUserModelId("com.plgvoice.notifications");
    }
  });

  // focus the window if we try to launch again
  app.on("second-instance", () => {
    mainWindow.show();
    mainWindow.restore();
    mainWindow.focus();
  });

  // macOS specific behaviour to keep app active in dock:
  // (irrespective of the minimise-to-tray option)

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // ensure URLs launch in external context
  app.on("web-contents-created", (_, contents) => {
    // prevent navigation out of build URL origin
    contents.on("will-navigate", (event, navigationUrl) => {
      if (new URL(navigationUrl).origin !== BUILD_URL.origin) {
        event.preventDefault();
      }
    });

    // handle links externally
    contents.setWindowOpenHandler(({ url }) => {
      if (
        url.startsWith("http:") ||
        url.startsWith("https:") ||
        url.startsWith("mailto:")
      ) {
        setImmediate(() => {
          shell.openExternal(url);
        });
      }

      return { action: "deny" };
    });
  });
} else {
  app.quit();
}
