import { createSignal } from "solid-js";

const [gameActivity, setGameActivity] = createSignal<string | null>(null);

let statusUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
let previousStatusText: string | null = null;
let statusSyncing = false;

/**
 * Get current game activity name (or null)
 */
export function getGameActivity(): string | null {
  return gameActivity();
}

/**
 * Initialize game activity listener from desktop app
 * Call this once at app startup
 */
export function initGameActivity(editUserStatus: (status: { text?: string | null }) => Promise<void>) {
  if (typeof window === "undefined" || !window.native) return;

  const native = window.native as {
    onGameActivity?: (cb: (game: string | null) => void) => void;
    getGameActivity?: () => string | null;
  };

  // Get initial state
  if (native.getGameActivity) {
    const initial = native.getGameActivity();
    if (initial) {
      setGameActivity(initial);
    }
  }

  // Listen for changes
  if (native.onGameActivity) {
    native.onGameActivity((game: string | null) => {
      setGameActivity(game);

      // Debounce status update by 5s
      if (statusUpdateTimeout) clearTimeout(statusUpdateTimeout);
      statusUpdateTimeout = setTimeout(async () => {
        if (statusSyncing) return;
        statusSyncing = true;
        try {
          if (game) {
            // Save previous status and set game status
            if (!previousStatusText) {
              // We'll restore to null/empty when game stops
              previousStatusText = ""; // placeholder
            }
            await editUserStatus({ text: `🎮 ${game}` });
          } else if (previousStatusText !== null) {
            // Restore previous status
            await editUserStatus({ text: previousStatusText || null });
            previousStatusText = null;
          }
        } catch (e) {
          console.error("[GameActivity] Failed to update status:", e);
        }
        statusSyncing = false;
      }, 5000);
    });
  }
}
