const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type NewUserLimits = {
  hours: number;
  length: number;
  attachments: number;
  friends: number;
};

type LimitsConfig = {
  features?: {
    limits?: {
      global?: { new_user_hours?: number };
      new_user?: {
        message_length?: number;
        message_attachments?: number;
        outgoing_friend_requests?: number;
      };
    };
  };
};

/** Milliseconds encoded in the first 10 characters of a ULID. */
export function ulidTime(id: string): number {
  let time = 0;
  for (const char of id.slice(0, 10).toUpperCase()) {
    const value = CROCKFORD.indexOf(char);
    if (value < 0) return 0;
    time = time * 32 + value;
  }
  return time;
}

/**
 * Tighter limits that apply for the first hours of an account.
 * Returns nothing once that window has passed.
 */
export function newUserLimits(
  userId: string | undefined,
  configuration: LimitsConfig | undefined,
  now = Date.now(),
): NewUserLimits | null {
  if (!userId) return null;
  const created = ulidTime(userId);
  if (!created) return null;

  const hours = configuration?.features?.limits?.global?.new_user_hours ?? 72;
  const limits = configuration?.features?.limits?.new_user;
  if (!limits?.message_length) return null;
  if (now - created >= hours * 60 * 60 * 1000) return null;

  return {
    hours,
    length: limits.message_length,
    attachments: limits.message_attachments ?? 3,
    friends: limits.outgoing_friend_requests ?? 5,
  };
}
