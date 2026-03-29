import {
  For,
  Match,
  Show,
  Switch,
  createSignal,
  useContext,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdStarFilled from "@material-design-icons/svg/filled/star.svg?component-solid";

import { CompositionMediaPickerContext } from "./CompositionMediaPicker";
import { MyGifPicker } from "./MyGifPicker";

/**
 * Tenor API v2 key (from env, or empty to disable search)
 */
const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY ?? "";

interface TenorGif {
  id: string;
  title: string;
  url: string;
  preview: string;
}

async function searchTenor(query: string): Promise<TenorGif[]> {
  if (!TENOR_API_KEY) return [];

  const endpoint = query.trim()
    ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=30&media_filter=gif,tinygif&locale=ru_RU`
    : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=30&media_filter=gif,tinygif&locale=ru_RU`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      id: r.id,
      title: r.title || "",
      url: r.media_formats?.gif?.url ?? r.media_formats?.mediumgif?.url ?? "",
      preview:
        r.media_formats?.tinygif?.url ??
        r.media_formats?.nanogif?.url ??
        r.media_formats?.gif?.url ??
        "",
    }));
  } catch {
    return [];
  }
}

export function GifPicker() {
  const { t } = useLingui();
  const [tab, setTab] = createSignal<"my" | "search">(TENOR_API_KEY ? "search" : "my");

  return (
    <Stack>
      <TabBar>
        <Tab
          active={tab() === "search"}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => setTab("search")}
        >
          <Trans>Search</Trans>
        </Tab>
        <Tab
          active={tab() === "my"}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => setTab("my")}
        >
          <Trans>My GIFs</Trans>
        </Tab>
      </TabBar>
      <Switch>
        <Match when={tab() === "search"}>
          <TenorSearch />
        </Match>
        <Match when={tab() === "my"}>
          <MyGifPicker />
        </Match>
      </Switch>
    </Stack>
  );
}

function TenorSearch() {
  const { t } = useLingui();
  const state = useState();
  const { onMessage } = useContext(CompositionMediaPickerContext);
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<TenorGif[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);

  let debounceTimer: ReturnType<typeof setTimeout>;

  // Load featured on mount
  (async () => {
    setLoading(true);
    const gifs = await searchTenor("");
    setResults(gifs);
    setLoading(false);
    setLoaded(true);
  })();

  const handleInput = (value: string) => {
    setQuery(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      const gifs = await searchTenor(value);
      setResults(gifs);
      setLoading(false);
      setLoaded(true);
    }, 400);
  };

  const isFavourite = (url: string) =>
    state.gifCollections.favourites.some((f) => f.url === url);

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder={t`Search GIFs...`}
        value={query()}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onInput={(e) => handleInput(e.currentTarget.value)}
      />
      <Show when={loading()}>
        <LoadingText>
          <Trans>Loading...</Trans>
        </LoadingText>
      </Show>
      <Show when={!loading() && loaded() && results().length === 0}>
        <LoadingText>
          <Symbol size={24}>search_off</Symbol>
          <Trans>No GIFs found</Trans>
        </LoadingText>
      </Show>
      <GifGrid>
        <For each={results()}>
          {(gif) => (
            <GifThumb
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
              onClick={() => onMessage(gif.url)}
            >
              <GifImage src={gif.preview} alt={gif.title} loading="lazy" />
              <FavBtn
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFavourite(gif.url)) {
                    state.gifCollections.removeFavourite(gif.url);
                  } else {
                    state.gifCollections.addFavourite(gif.url, gif.title);
                  }
                }}
              >
                <Show when={isFavourite(gif.url)} fallback={<Symbol size={16}>star_border</Symbol>}>
                  <MdStarFilled style={{ width: "16px", height: "16px" }} />
                </Show>
              </FavBtn>
            </GifThumb>
          )}
        </For>
      </GifGrid>
      <TenorAttribution>
        Powered by Tenor
      </TenorAttribution>
    </SearchContainer>
  );
}

const TabBar = styled("div", {
  base: {
    display: "flex",
    gap: "2px",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    marginBottom: "var(--gap-sm)",
  },
});

const Tab = styled("button", {
  base: {
    flex: 1,
    padding: "var(--gap-sm) var(--gap-md)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface-variant)",
    borderBottom: "2px solid transparent",
    transition: "all 0.15s",
    "&:hover": {
      color: "var(--md-sys-color-on-surface)",
    },
  },
  variants: {
    active: {
      true: {
        color: "var(--md-sys-color-primary)",
        borderBottomColor: "var(--md-sys-color-primary)",
      },
    },
  },
});

const Stack = styled("div", {
  base: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
});

const SearchContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    gap: "var(--gap-sm)",
  },
});

const SearchInput = styled("input", {
  base: {
    padding: "8px 12px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "14px",
    outline: "none",
    margin: "0 var(--gap-sm)",
    "&:focus": {
      borderColor: "var(--md-sys-color-primary)",
    },
    "&::placeholder": {
      color: "var(--md-sys-color-on-surface-variant)",
    },
  },
});

const GifGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "4px",
    overflow: "auto",
    padding: "0 var(--gap-sm)",
    flex: 1,
  },
});

const GifThumb = styled("div", {
  base: {
    position: "relative",
    aspectRatio: "1",
    cursor: "pointer",
    borderRadius: "var(--borderRadius-sm)",
    overflow: "hidden",
    "&:hover > div": {
      opacity: 1,
    },
  },
});

const GifImage = styled("img", {
  base: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

const FavBtn = styled("div", {
  base: {
    position: "absolute",
    top: "2px",
    right: "2px",
    opacity: 0,
    background: "rgba(0,0,0,0.7)",
    borderRadius: "50%",
    padding: "4px",
    cursor: "pointer",
    color: "#fbbf24",
    fill: "#fbbf24",
    transition: "opacity 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

const LoadingText = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "24px 16px",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "14px",
    textAlign: "center",
    opacity: 0.7,
  },
});

const TenorAttribution = styled("div", {
  base: {
    padding: "4px",
    textAlign: "center",
    fontSize: "10px",
    color: "var(--md-sys-color-outline)",
    flexShrink: 0,
  },
});
