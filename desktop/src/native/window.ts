import { join } from "node:path";

import {
  BrowserWindow,
  Menu,
  MenuItem,
  app,
  dialog,
  ipcMain,
  nativeImage,
} from "electron";

import windowIconAsset from "../../assets/desktop/icon.png?asset";

import { config } from "./config";
import { updateTrayMenu } from "./tray";

// global reference to main window
export let mainWindow: BrowserWindow;

// currently in-use build
export const BUILD_URL = new URL(
  app.commandLine.hasSwitch("force-server")
    ? app.commandLine.getSwitchValue("force-server")
    : /*MAIN_WINDOW_VITE_DEV_SERVER_URL ??*/ "https://cvaboda.duckdns.org",
);

// internal window state
let shouldQuit = false;

// load the window icon
const windowIcon = nativeImage.createFromDataURL(windowIconAsset);

// windowIcon.setTemplateImage(true);

/**
 * Create the main application window
 */
export function createMainWindow() {
  // (CLI arg --hidden or config)
  const startHidden =
    app.commandLine.hasSwitch("hidden") || config.startMinimisedToTray;

  // create the window
  mainWindow = new BrowserWindow({
    minWidth: 300,
    minHeight: 300,
    width: 1280,
    height: 720,
    backgroundColor: "#191919",
    frame: !config.customFrame,
    icon: windowIcon,
    show: !startHidden,
    webPreferences: {
      // relative to `.vite/build`
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  // hide the options
  mainWindow.setMenu(null);

  // restore last position if it was moved previously
  if (config.windowState.x > 0 || config.windowState.y > 0) {
    mainWindow.setPosition(
      config.windowState.x ?? 0,
      config.windowState.y ?? 0,
    );
  }

  // restore last size if it was resized previously
  if (config.windowState.width > 0 && config.windowState.height > 0) {
    mainWindow.setSize(
      config.windowState.width ?? 1280,
      config.windowState.height ?? 720,
    );
  }

  // maximise the window if it was maximised before
  if (config.windowState.isMaximised) {
    mainWindow.maximize();
  }

  // load the entrypoint — desktop skips landing, goes straight to login
  const startURL = new URL("/login", BUILD_URL);
  mainWindow.loadURL(startURL.toString());

  // handle window close with optional dialog
  mainWindow.on("close", (event) => {
    if (shouldQuit) return;

    event.preventDefault();

    // If user already chose "don't ask again", use saved preference
    if (!config.askBeforeClose) {
      if (config.minimiseToTray) {
        mainWindow.hide();
      } else {
        shouldQuit = true;
        mainWindow.close();
      }
      return;
    }

    // Show close dialog
    dialog
      .showMessageBox(mainWindow, {
        type: "question",
        title: "PLG Voice",
        message: "Что сделать с приложением?",
        buttons: ["Свернуть в трей", "Закрыть полностью", "Отмена"],
        defaultId: 0,
        cancelId: 2,
        checkboxLabel: "Больше не спрашивать",
        checkboxChecked: false,
      })
      .then(({ response, checkboxChecked }) => {
        if (response === 2) return; // Cancel

        if (checkboxChecked) {
          config.askBeforeClose = false;
          config.minimiseToTray = response === 0;
        }

        if (response === 0) {
          mainWindow.hide();
        } else {
          shouldQuit = true;
          mainWindow.close();
        }
      });
  });

  // update tray menu when window is shown/hidden
  mainWindow.on("show", updateTrayMenu);
  mainWindow.on("hide", updateTrayMenu);

  // keep track of window state
  function generateState() {
    config.windowState = {
      x: mainWindow.getPosition()[0],
      y: mainWindow.getPosition()[1],
      width: mainWindow.getSize()[0],
      height: mainWindow.getSize()[1],
      isMaximised: mainWindow.isMaximized(),
    };
  }

  mainWindow.on("maximize", generateState);
  mainWindow.on("unmaximize", generateState);
  mainWindow.on("moved", generateState);
  mainWindow.on("resized", generateState);

  // rebind zoom controls to be more sensible
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && (input.key === "=" || input.key === "+")) {
      // zoom in (+)
      event.preventDefault();
      mainWindow.webContents.setZoomLevel(
        mainWindow.webContents.getZoomLevel() + 1,
      );
    } else if (input.control && input.key === "-") {
      // zoom out (-)
      event.preventDefault();
      mainWindow.webContents.setZoomLevel(
        mainWindow.webContents.getZoomLevel() - 1,
      );
    } else if (input.control && input.key === "0") {
      // reset zoom to default.
      event.preventDefault();
      mainWindow.webContents.setZoomLevel(0);
    } else if (
      input.key === "F5" ||
      ((input.control || input.meta) && input.key.toLowerCase() === "r")
    ) {
      event.preventDefault();
      mainWindow.webContents.reload();
    }
  });

  // send the config and inject desktop overrides
  mainWindow.webContents.on("did-finish-load", () => {
    config.sync();

    // Hide the custom web titlebar when using native Windows frame
    if (!config.customFrame) {
      mainWindow.webContents.insertCSS(`
        [style*="-webkit-app-region"] { -webkit-app-region: none !important; }
      `);
      mainWindow.webContents.executeJavaScript(`
        // Observe DOM and hide any titlebar elements rendered by the web client
        const observer = new MutationObserver(() => {
          // Hide wordmark SVG (PLG Voice logo in titlebar)
          document.querySelectorAll('svg').forEach(svg => {
            if (svg.querySelector('text') && svg.textContent.includes('PLG Voice')) {
              const titleDiv = svg.closest('[style*="app-region"]');
              if (titleDiv) titleDiv.style.display = 'none';
            }
          });
          // Hide the 29px titlebar container
          document.querySelectorAll('div').forEach(div => {
            const s = div.style;
            if (s.height === '29px' && div.querySelector('[style*="app-region"]')) {
              div.style.display = 'none';
            }
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      `);
    }
  });

  // configure spellchecker context menu
  mainWindow.webContents.on("context-menu", (_, params) => {
    const menu = new Menu();

    // add all suggestions
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () => mainWindow.webContents.replaceMisspelling(suggestion),
        }),
      );
    }

    // allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: "Add to dictionary",
          click: () =>
            mainWindow.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord,
            ),
        }),
      );
    }

    // add an option to toggle spellchecker
    menu.append(
      new MenuItem({
        label: "Toggle spellcheck",
        click() {
          config.spellchecker = !config.spellchecker;
        },
      }),
    );

    // show menu if we've generated enough entries
    if (menu.items.length > 0) {
      menu.popup();
    }
  });

  // push world events to the window
  ipcMain.on("minimise", () => mainWindow.minimize());
  ipcMain.on("maximise", () =>
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(),
  );
  ipcMain.on("close", () => mainWindow.close());

  // mainWindow.webContents.openDevTools();

  // let i = 0;
  // setInterval(() => setBadgeCount((++i % 30) + 1), 1000);
}

/**
 * Quit the entire app
 */
export function quitApp() {
  shouldQuit = true;
  mainWindow.close();
}

// Ensure global app quit works properly
app.on("before-quit", () => {
  shouldQuit = true;
});
