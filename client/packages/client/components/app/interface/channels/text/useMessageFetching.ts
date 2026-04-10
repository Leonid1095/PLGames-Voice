import { batch, createSignal } from "solid-js";

import { Channel, Message as MessageInterface } from "stoat.js";

import { ListView2Update } from "@revolt/ui/components/utils/ListView2";

/**
 * Initial fetch limit
 */
const INITIAL_FETCH_LIMIT = 30;

/**
 * Fetch limit
 */
const FETCH_LIMIT = 50;

/**
 * Display limit
 */
const DISPLAY_LIMIT = 150;

export { FETCH_LIMIT };

export interface CachedChannelState {
  messages: MessageInterface[];
  atStart: boolean;
  atEnd: boolean;
  scrollTop?: number;
}

export interface MessageFetchingState {
  messages: () => MessageInterface[];
  setMessages: (fn: MessageInterface[] | ((prev: MessageInterface[]) => MessageInterface[])) => void;
  atStart: () => boolean;
  setStart: (v: boolean) => void;
  atEnd: () => boolean;
  setEnd: (v: boolean) => void;
  fetching: () => string | undefined;
  failure: () => boolean;

  canFetch: () => boolean;
  preempt: () => void;
  setMessagesSafely: (...messagesArr: MessageInterface[][]) => void;

  caseInitialLoad: (
    channel: Channel,
    cache: { unmanage: (ch: Channel) => CachedChannelState | undefined },
    listRef: HTMLDivElement | undefined,
    nearby?: string,
  ) => Promise<void>;

  caseFetchUpwards: (channel: Channel) => Promise<ListView2Update | undefined>;
  caseFetchDownwards: (channel: Channel) => Promise<ListView2Update | undefined>;
  caseJumpToBottom: (
    channel: Channel,
    listRef: HTMLDivElement | undefined,
  ) => Promise<void>;
  caseJumpToMessage: (
    channel: Channel,
    messageId: string,
    listRef: HTMLDivElement | undefined,
    findMessageIndex: (id: string) => number,
    atStartVal: boolean,
  ) => Promise<void>;

  /** Append a new message (real-time) */
  onNewMessage: (message: MessageInterface, channelId: string) => void;
  /** Remove a deleted message */
  onDeleteMessage: (messageId: string, channelId: string) => void;
}

/**
 * Hook for message fetching logic — extracted from Messages.tsx
 */
export function useMessageFetching(): MessageFetchingState {
  const [messages, setMessages] = createSignal<MessageInterface[]>([]);
  const [atStart, setStart] = createSignal(false);
  const [atEnd, setEnd] = createSignal(true);
  const [fetching, setFetching] = createSignal<string>();
  const [failure, setFailure] = createSignal(false);

  let collectedMessages: MessageInterface[] | undefined;
  let preemptFetch: (() => void) | undefined;

  function canFetch() {
    return !fetching() || failure();
  }

  function preempt() {
    batch(() => {
      setFetching();
      setFailure(false);
      preemptFetch?.();
    });
  }

  function newPreempted() {
    let preempted = false;
    preemptFetch = () => {
      preempted = true;
    };
    return () => preempted;
  }

  function setMessagesSafely(...messagesArr: MessageInterface[][]) {
    setMessages(
      messagesArr.flat().toSorted((a, b) => b.id.localeCompare(a.id)),
    );
  }

  async function caseInitialLoad(
    channel: Channel,
    cache: { unmanage: (ch: Channel) => CachedChannelState | undefined },
    listRef: HTMLDivElement | undefined,
    nearby?: string,
  ) {
    preempt();
    setFetching("initial");
    const preempted = newPreempted();

    setMessages([]);
    setStart(false);
    setEnd(true);
    collectedMessages = [];

    try {
      let msgs;
      const existingState = cache.unmanage(channel);
      const useExistingState = existingState && !nearby;

      if (useExistingState) {
        msgs = existingState.messages;
      } else {
        msgs = await channel
          .fetchMessagesWithUsers({
            limit: INITIAL_FETCH_LIMIT,
            nearby,
          })
          .then(({ messages }) => messages);
      }

      if (preempted()) return;

      if (typeof nearby === "string") {
        setEnd(
          msgs.findIndex((msg) => msg.id === channel.lastMessageId) !== -1,
        );
      } else if (!useExistingState && msgs.length < INITIAL_FETCH_LIMIT) {
        setStart(true);
      } else if (existingState) {
        setStart(existingState.atStart);
        setEnd(existingState.atEnd);
      }

      if (atEnd()) {
        const knownIds = new Set(collectedMessages!.map((x) => x.id));
        setMessagesSafely(
          collectedMessages!,
          msgs.filter((x) => !knownIds.has(x.id)),
        );
      } else {
        setMessages(msgs);
      }

      collectedMessages = [];
      setFetching();

      if (existingState && !existingState.atEnd) {
        setTimeout(() =>
          listRef?.scrollTo({
            top: existingState.scrollTop!,
            behavior: "instant",
          }),
        );
      } else if (atEnd()) {
        setTimeout(() =>
          listRef?.scrollTo({
            top: 9999999,
            behavior: "instant",
          }),
        );
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchUpwards(
    channel: Channel,
  ): Promise<ListView2Update | undefined> {
    if (atStart() || !canFetch()) return;
    setFetching("upwards");
    const preempted = newPreempted();

    try {
      const result = await channel.fetchMessagesWithUsers({
        limit: FETCH_LIMIT,
        before: messages().slice(-1)[0].id,
      });

      if (preempted()) return;

      if (result.messages.length < FETCH_LIMIT) {
        setStart(true);
      }

      if (result.messages.length) {
        const tooManyBy = Math.max(
          0,
          result.messages.length + messages().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setEnd(false);
        }

        const msgs = messages();
        return {
          scrollAnchorId: msgs[msgs.length - 1].id,
          commitToDOM() {
            setMessagesSafely(messages(), result.messages);

            if (tooManyBy) {
              setMessages((prev) => prev.slice(tooManyBy));
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchDownwards(
    channel: Channel,
  ): Promise<ListView2Update | undefined> {
    if (atEnd() || !canFetch()) return;
    setFetching("downwards");
    const preempted = newPreempted();

    try {
      const result = await channel.fetchMessagesWithUsers({
        limit: FETCH_LIMIT,
        after: messages()[0].id,
        sort: "Oldest",
      });

      if (preempted()) return;

      if (result.messages.length < FETCH_LIMIT) {
        setEnd(true);
      }

      if (result.messages.length) {
        const tooManyBy = Math.max(
          0,
          result.messages.length + messages().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setStart(false);
        }

        return {
          scrollAnchorId: messages()[0].id,
          commitToDOM() {
            setMessages(() => [...result.messages.reverse(), ...messages()]);

            if (tooManyBy) {
              setMessages((prev) => prev.slice(0, -tooManyBy));
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  function findScrollContainer(el: Element | null) {
    if (!el) return null;
    else if (getComputedStyle(el).overflowY === "scroll") return el;
    else return el.parentElement;
  }

  async function caseJumpToBottom(
    channel: Channel,
    listRef: HTMLDivElement | undefined,
  ) {
    if (atEnd()) {
      const containerChild = findScrollContainer(listRef!)!.children[0];
      containerChild!.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      preempt();
      setFetching("jump_end");
      const preempted = newPreempted();
      collectedMessages = [];

      try {
        const { messages: msgs } = await channel.fetchMessagesWithUsers({
          limit: FETCH_LIMIT,
        });

        if (preempted()) return;

        if (msgs.length < FETCH_LIMIT) {
          setStart(true);
        } else {
          setStart(false);
        }

        setEnd(true);

        const knownIds = new Set(collectedMessages!.map((x) => x.id));
        setMessagesSafely(
          collectedMessages!,
          msgs.filter((x) => !knownIds.has(x.id)),
        );

        collectedMessages = [];

        setTimeout(() => {
          const containerChild = findScrollContainer(listRef!)!.children[0];
          containerChild!.scrollIntoView({ behavior: "instant", block: "start" });

          setTimeout(() => {
            containerChild!.scrollIntoView({ behavior: "smooth", block: "end" });
            setFetching();
          });
        });
      } catch {
        setFailure(true);
        setFetching();
      }
    }
  }

  async function caseJumpToMessage(
    channel: Channel,
    messageId: string,
    listRef: HTMLDivElement | undefined,
    findMessageIndex: (id: string) => number,
    atStartVal: boolean,
  ) {
    if (messages().find((message) => message.id === messageId)) {
      const index = findMessageIndex(messageId);
      listRef!.children[index + (atStartVal ? 1 : 0)].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    preempt();
    setFetching("jump_msg");
    const preempted = newPreempted();

    try {
      const { messages: msgs } = await channel.fetchMessagesWithUsers({
        limit: FETCH_LIMIT,
        nearby: messageId,
      });

      if (preempted()) return;

      setStart(false);
      setEnd(false);
      setMessagesSafely(msgs);

      setTimeout(() => {
        const index = findMessageIndex(messageId);
        listRef!.children[index + (atStartVal ? 1 : 0)].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setTimeout(() => {
          setFetching();
        }, 300);
      });
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  function onNewMessage(message: MessageInterface, channelId: string) {
    if (message.channelId === channelId && atEnd()) {
      setMessages([message, ...messages()]);
    }
  }

  function onDeleteMessage(messageId: string, channelId: string) {
    if (messages().find((msg) => msg.id === messageId)) {
      setMessages((msgs) => msgs.filter((msg) => msg.id !== messageId));
    }
  }

  return {
    messages,
    setMessages,
    atStart,
    setStart,
    atEnd,
    setEnd,
    fetching,
    failure,
    canFetch,
    preempt,
    setMessagesSafely,
    caseInitialLoad,
    caseFetchUpwards,
    caseFetchDownwards,
    caseJumpToBottom,
    caseJumpToMessage,
    onNewMessage,
    onDeleteMessage,
  };
}
