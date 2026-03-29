import { exec } from "child_process";
import { BrowserWindow } from "electron";

import gameDatabase from "./gameDatabase.json";

let scanInterval: ReturnType<typeof setInterval> | null = null;
let currentGame: string | null = null;

const SCAN_INTERVAL_MS = 15000;

/**
 * Scan running processes and detect games
 */
function scanProcesses(): Promise<string[]> {
  return new Promise((resolve) => {
    const platform = process.platform;
    let cmd: string;

    if (platform === "win32") {
      cmd = 'tasklist /fo csv /nh';
    } else {
      cmd = 'ps -e -o comm=';
    }

    exec(cmd, { timeout: 10000 }, (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }

      if (platform === "win32") {
        // Parse CSV: "process.exe","PID","Session","Session#","Mem"
        const processes = stdout
          .split("\n")
          .map((line) => {
            const match = line.match(/^"([^"]+)"/);
            return match ? match[1] : "";
          })
          .filter(Boolean);
        resolve(processes);
      } else {
        const processes = stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        resolve(processes);
      }
    });
  });
}

/**
 * Match processes against game database
 */
function detectGame(processes: string[]): string | null {
  const db = gameDatabase as Record<string, { name: string }>;
  for (const proc of processes) {
    // Try exact match first
    if (db[proc]) return db[proc].name;
    // Try basename (Linux: /usr/bin/game -> game)
    const basename = proc.split("/").pop() || proc;
    if (db[basename]) return db[basename].name;
  }
  return null;
}

/**
 * Send game activity to renderer
 */
function notifyRenderer(game: string | null) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send("game-activity-changed", game);
  }
}

/**
 * Run one scan cycle
 */
async function tick() {
  const processes = await scanProcesses();
  const detected = detectGame(processes);

  if (detected !== currentGame) {
    currentGame = detected;
    console.log(`[GameDetector] Activity: ${detected || "none"}`);
    notifyRenderer(detected);
  }
}

/**
 * Start the game detector
 */
export function startGameDetector() {
  if (scanInterval) return;
  console.log("[GameDetector] Starting...");
  tick(); // initial scan
  scanInterval = setInterval(tick, SCAN_INTERVAL_MS);
}

/**
 * Stop the game detector
 */
export function stopGameDetector() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  if (currentGame) {
    currentGame = null;
    notifyRenderer(null);
  }
  console.log("[GameDetector] Stopped");
}

/**
 * Get current game (for IPC sync requests)
 */
export function getCurrentGame(): string | null {
  return currentGame;
}
