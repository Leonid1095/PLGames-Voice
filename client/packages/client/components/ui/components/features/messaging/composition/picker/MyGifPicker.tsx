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

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";
import {
  Button,
  IconButton,
  Text,
  TextField,
} from "@revolt/ui/components/design";
import { Column, Row } from "@revolt/ui/components/layout";

import { CompositionMediaPickerContext } from "./CompositionMediaPicker";

import MdAdd from "@material-design-icons/svg/outlined/add.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdArrowBack from "@material-design-icons/svg/outlined/arrow_back.svg?component-solid";
import MdStar from "@material-design-icons/svg/outlined/star.svg?component-solid";
import MdStarFilled from "@material-design-icons/svg/filled/star.svg?component-solid";

type View =
  | { type: "list" }
  | { type: "collection"; id: string }
  | { type: "create" }
  | { type: "favourites" };

export function MyGifPicker() {
  const { t } = useLingui();
  const state = useState();
  const [view, setView] = createSignal<View>({ type: "list" });

  return (
    <Container>
      <Switch>
        <Match when={view().type === "list"}>
          <CollectionList
            onOpen={(id) => setView({ type: "collection", id })}
            onCreate={() => setView({ type: "create" })}
            onFavourites={() => setView({ type: "favourites" })}
          />
        </Match>
        <Match when={view().type === "create"}>
          <CreateCollection
            onBack={() => setView({ type: "list" })}
            onCreated={(id) => setView({ type: "collection", id })}
          />
        </Match>
        <Match when={view().type === "favourites"}>
          <FavouritesView onBack={() => setView({ type: "list" })} />
        </Match>
        <Match when={view().type === "collection"}>
          <CollectionView
            id={(view() as { type: "collection"; id: string }).id}
            onBack={() => setView({ type: "list" })}
          />
        </Match>
      </Switch>
    </Container>
  );
}

function CollectionList(props: {
  onOpen: (id: string) => void;
  onCreate: () => void;
  onFavourites: () => void;
}) {
  const state = useState();

  return (
    <Column gap="sm">
      <Row align gap="sm">
        <Text class="title" style={{ "flex-grow": 1 }}>
          <Trans>My GIFs</Trans>
        </Text>
        <IconButton onPress={props.onCreate}>
          <MdAdd />
        </IconButton>
      </Row>

      <CollectionItem
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onClick={props.onFavourites}
      >
        <MdStar />
        <span>
          <Trans>Favourites</Trans>
        </span>
        <CountBadge>{state.gifCollections.favourites.length}</CountBadge>
      </CollectionItem>

      <For each={state.gifCollections.collections}>
        {(collection) => (
          <CollectionItem
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }}
            onClick={() => props.onOpen(collection.id)}
          >
            <span>{collection.name}</span>
            <CountBadge>{collection.gifs.length}</CountBadge>
          </CollectionItem>
        )}
      </For>

      <Show when={state.gifCollections.collections.length === 0}>
        <Text class="label" size="small" style={{ "text-align": "center", padding: "16px" }}>
          <Trans>Create your first GIF collection!</Trans>
        </Text>
      </Show>
    </Column>
  );
}

function CreateCollection(props: {
  onBack: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useLingui();
  const state = useState();
  const [name, setName] = createSignal("");

  function create() {
    const n = name().trim();
    if (!n) return;
    const id = state.gifCollections.createCollection(n);
    props.onCreated(id);
  }

  return (
    <Column gap="sm">
      <Row align gap="sm">
        <IconButton
          onPress={() => {
            props.onBack();
          }}
        >
          <MdArrowBack />
        </IconButton>
        <Text class="title">
          <Trans>New collection</Trans>
        </Text>
      </Row>
      <TextField
        autoFocus
        variant="filled"
        placeholder={t`Collection name`}
        value={name()}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      <Button onPress={create} isDisabled={!name().trim()}>
        <Trans>Create</Trans>
      </Button>
    </Column>
  );
}

function FavouritesView(props: { onBack: () => void }) {
  const state = useState();
  const { onMessage } = useContext(CompositionMediaPickerContext);

  return (
    <Column gap="sm">
      <Row align gap="sm">
        <IconButton onPress={props.onBack}>
          <MdArrowBack />
        </IconButton>
        <Text class="title">
          <Trans>Favourites</Trans>
        </Text>
      </Row>
      <GifGrid>
        <For each={state.gifCollections.favourites}>
          {(gif) => (
            <GifThumb
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
              onClick={() => onMessage(gif.url)}
            >
              <GifImage src={gif.url} loading="lazy" />
              <RemoveBtn
                onClick={(e) => {
                  e.stopPropagation();
                  state.gifCollections.removeFavourite(gif.url);
                }}
              >
                <MdDelete />
              </RemoveBtn>
            </GifThumb>
          )}
        </For>
      </GifGrid>
      <Show when={state.gifCollections.favourites.length === 0}>
        <Text class="label" size="small" style={{ "text-align": "center", padding: "16px" }}>
          <Trans>No favourite GIFs yet</Trans>
        </Text>
      </Show>
    </Column>
  );
}

function CollectionView(props: { id: string; onBack: () => void }) {
  const { t } = useLingui();
  const state = useState();
  const client = useClient();
  const { onMessage } = useContext(CompositionMediaPickerContext);
  const [uploading, setUploading] = createSignal(false);

  const collection = () =>
    state.gifCollections.collections.find((c) => c.id === props.id);

  async function uploadGif() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/gif,video/webm,video/mp4,image/webp";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files?.length) return;
      setUploading(true);
      try {
        for (const file of Array.from(input.files)) {
          const result = await client().uploadFile("attachments", file);
          const url = `${new URL(client().configuration!.features.autumn.url).origin}/${result.tag}/${result.id}`;
          state.gifCollections.addGif(props.id, url, file.name);
        }
      } catch (e) {
        console.error("GIF upload failed:", e);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  return (
    <Column gap="sm">
      <Row align gap="sm">
        <IconButton onPress={props.onBack}>
          <MdArrowBack />
        </IconButton>
        <Text class="title" style={{ "flex-grow": 1 }}>
          {collection()?.name}
        </Text>
        <IconButton onPress={uploadGif}>
          <MdAdd />
        </IconButton>
        <IconButton
          onPress={() => {
            state.gifCollections.deleteCollection(props.id);
            props.onBack();
          }}
        >
          <MdDelete />
        </IconButton>
      </Row>

      <Show when={uploading()}>
        <Text class="label" size="small">
          <Trans>Uploading...</Trans>
        </Text>
      </Show>

      <GifGrid>
        <For each={collection()?.gifs}>
          {(gif) => (
            <GifThumb
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
              onClick={() => onMessage(gif.url)}
            >
              <GifImage src={gif.url} loading="lazy" />
              <RemoveBtn
                onClick={(e) => {
                  e.stopPropagation();
                  state.gifCollections.removeGif(props.id, gif.url);
                }}
              >
                <MdDelete />
              </RemoveBtn>
            </GifThumb>
          )}
        </For>
      </GifGrid>

      <Show when={!collection()?.gifs.length}>
        <Text class="label" size="small" style={{ "text-align": "center", padding: "16px" }}>
          <Trans>Press + to add GIFs</Trans>
        </Text>
      </Show>
    </Column>
  );
}

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "auto",
    padding: "var(--gap-sm)",
    gap: "var(--gap-sm)",
  },
});

const CollectionItem = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
    padding: "var(--gap-sm) var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    cursor: "pointer",
    "&:hover": {
      background: "var(--md-sys-color-surface-container-highest)",
    },
  },
});

const CountBadge = styled("span", {
  base: {
    marginLeft: "auto",
    fontSize: "12px",
    color: "var(--md-sys-color-outline)",
  },
});

const GifGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "4px",
    overflow: "auto",
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

const RemoveBtn = styled("div", {
  base: {
    position: "absolute",
    top: "2px",
    right: "2px",
    opacity: 0,
    background: "rgba(0,0,0,0.7)",
    borderRadius: "50%",
    padding: "2px",
    cursor: "pointer",
    color: "white",
    transition: "opacity 0.15s",
    "& svg": {
      width: "16px",
      height: "16px",
    },
  },
});
