import {
  For,
  Match,
  Show,
  Switch,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";

import { Star } from "lucide-solid";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { CompositionMediaPickerContext } from "./CompositionMediaPicker";
import { MyGifPicker } from "./MyGifPicker";

/**
 * Giphy API key (from env, or empty to disable search)
 * Get a free key at https://developers.giphy.com/
 */
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY ?? "";

interface GifResult {
  id: string;
  title: string;
  url: string;
  preview: string;
}

async function searchGiphy(query: string): Promise<GifResult[]> {
  if (!GIPHY_API_KEY) return [];

  const endpoint = query.trim()
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&lang=ru&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=pg-13`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map((g: any) => ({
      id: g.id,
      title: g.title || "",
      url: g.images?.original?.url ?? g.images?.downsized_medium?.url ?? "",
      preview: g.images?.fixed_width_small?.url ?? g.images?.preview_gif?.url ?? g.images?.fixed_width?.url ?? "",
    }));
  } catch {
    return [];
  }
}

export function GifPicker() {
  const { t } = useLingui();
  const [tab, setTab] = createSignal<"my" | "search">(GIPHY_API_KEY ? "search" : "my");

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
          <GiphySearch />
        </Match>
        <Match when={tab() === "my"}>
          <MyGifPicker />
        </Match>
      </Switch>
    </Stack>
  );
}

function GiphySearch() {
  const { t } = useLingui();
  const state = useState();
  const { onMessage } = useContext(CompositionMediaPickerContext);
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<GifResult[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);

  let debounceTimer: ReturnType<typeof setTimeout>;
  onCleanup(() => clearTimeout(debounceTimer));

  // Load trending on mount
  (async () => {
    setLoading(true);
    const gifs = await searchGiphy("");
    setResults(gifs);
    setLoading(false);
    setLoaded(true);
  })();

  const handleInput = (value: string) => {
    setQuery(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      const gifs = await searchGiphy(value);
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
                  <Star style={{ width: "16px", height: "16px", fill: "#fbbf24" }} />
                </Show>
              </FavBtn>
            </GifThumb>
          )}
        </For>
      </GifGrid>
      <GiphyAttribution>
        Powered by GIPHY
      </GiphyAttribution>
    </SearchContainer>
  );
}

const TabBar = styled("div", {
  base: {
    display: "flex",
    gap: "2px",
    borderBottom: "1px solid var(--pd-border-subtle)",
    marginBottom: "8px",
  },
});

const Tab = styled("button", {
  base: {
    flex: 1,
    padding: "8px 12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    color: "var(--md-sys-color-on-surface-variant)",
    borderBottom: "2px solid transparent",
    transition: "color var(--pd-transition-fast), border-color var(--pd-transition-fast)",
    "&:hover": {
      color: "var(--md-sys-color-on-surface)",
    },
  },
  variants: {
    active: {
      true: {
        color: "var(--md-sys-color-on-surface)",
        borderBottomColor: "var(--md-sys-color-primary)",
        fontWeight: 600,
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
    border: "1px solid var(--pd-border-default)",
    borderRadius: "var(--pd-radius-sm)",
    background: "var(--pd-tint-subtle)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
    letterSpacing: "-0.005em",
    outline: "none",
    margin: "0 8px",
    transition: "border-color var(--pd-transition-fast), box-shadow var(--pd-transition-fast)",
    "&:focus": {
      borderColor: "var(--md-sys-color-primary)",
      boxShadow: "0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent)",
    },
    "&::placeholder": {
      color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
    },
  },
});

const GifGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    /*
     * `grid-auto-rows: 1fr` was dividing the scroller's height across every
     * row, so twelve rows of GIFs each got a twelfth of the panel -- the
     * thumbnails rendered as horizontal slivers. Rows size to their content
     * now, and the 1:1 aspect-ratio on the thumb is what sets the height.
     */
    gridAutoRows: "min-content",
    gap: "8px",
    overflow: "auto",
    padding: "4px 8px 8px",
    flex: 1,
  },
});

const GifThumb = styled("div", {
  base: {
    position: "relative",
    aspectRatio: "1 / 1",
    width: "100%",
    height: "auto",
    minHeight: 0,
    cursor: "pointer",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--pd-border-subtle)",
    overflow: "hidden",
    background: "var(--md-sys-color-surface-container-low)",
    transition: "border-color var(--pd-transition-fast)",
    "&:hover": {
      borderColor: "var(--pd-border-default)",
    },
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
    transition: "opacity var(--pd-transition-fast)",
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

const GiphyAttribution = styled("div", {
  base: {
    padding: "4px",
    textAlign: "center",
    fontSize: "10px",
    color: "var(--md-sys-color-outline)",
    flexShrink: 0,
  },
});
