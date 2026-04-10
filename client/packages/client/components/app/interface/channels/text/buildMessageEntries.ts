import isEqual from "lodash.isequal";
import { Message as MessageInterface } from "stoat.js";

import type { ListEntry } from "./MessagesEntry";

/**
 * Build enriched message entries with tail determination,
 * blocked message grouping, unread dividers, and date separators.
 *
 * Extracted from Messages.tsx messagesWithTail memo.
 */
export function buildMessageEntries(
  messages: MessageInterface[],
  lastReadId: string,
  objectCache: Map<any, any>,
  formatDate: (date: Date) => string,
): ListEntry[] {
  const entries: ListEntry[] = [];

  let blockedMessages = 0;
  let insertedUnreadDivider = false;

  const flushBlocked = () => {
    if (blockedMessages) {
      entries.push({ t: 2, count: blockedMessages });
      blockedMessages = 0;
    }
  };

  messages.forEach((message, index) => {
    const next = messages[index + 1];
    let tail = true;
    let date: Date | null = null;

    if (next) {
      const adate = message.createdAt;
      const bdate = next.createdAt;
      const atime = +adate;
      const btime = +bdate;

      // Date separator between different days
      if (
        adate.getFullYear() !== bdate.getFullYear() ||
        adate.getMonth() !== bdate.getMonth() ||
        adate.getDate() !== bdate.getDate()
      ) {
        date = adate;
      }

      // Tail determination — break the chain if:
      if (
        message.authorId !== next.authorId ||
        Math.abs(btime - atime) >= 420000 ||
        !isEqual(message.masquerade, next.masquerade) ||
        message.systemMessage ||
        next.systemMessage ||
        message.replyIds?.length ||
        (next.id.localeCompare(lastReadId) === -1 && !insertedUnreadDivider)
      ) {
        tail = false;
      }
    } else {
      tail = false;
    }

    // Unread divider
    if (!insertedUnreadDivider && message.id.localeCompare(lastReadId) === -1) {
      insertedUnreadDivider = true;
      entries.push(
        objectCache.get(true) ?? { t: 1, unread: true },
      );
    }

    // Blocked message grouping
    if (message.author?.relationship === "Blocked") {
      blockedMessages++;
    } else {
      flushBlocked();
      entries.push(
        objectCache.get(`${message.id}:${tail}`) ?? { t: 0, message, tail },
      );
    }

    // Date separator
    if (date) {
      entries.push(
        objectCache.get(date) ?? { t: 1, date: formatDate(date) },
      );
    }
  });

  // Flush remaining blocked messages
  flushBlocked();

  // Strip unread divider if it is the first item
  if (entries[0]?.t === 1) {
    entries.shift();
  }

  // Update cache
  objectCache.clear();
  for (const object of entries) {
    if (object.t === 0) {
      objectCache.set(`${object.message.id}:${object.tail}`, object);
    } else if (object.t === 1) {
      objectCache.set(object.unread ?? object.date, object);
    }
  }

  return entries.reverse();
}
