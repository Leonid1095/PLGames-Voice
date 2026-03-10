import { State } from "..";

import { AbstractStore } from ".";

export interface GifItem {
  /** Autumn file URL */
  url: string;
  /** Original filename */
  name?: string;
  /** When added (ISO string) */
  addedAt: string;
}

export interface GifCollection {
  /** Unique ID */
  id: string;
  /** Collection name */
  name: string;
  /** GIF items in this collection */
  gifs: GifItem[];
  /** When created (ISO string) */
  createdAt: string;
}

export interface TypeGifCollections {
  /** User's GIF collections */
  collections: GifCollection[];
  /** Favourite GIFs (quick access) */
  favourites: GifItem[];
}

/**
 * Manages user GIF collections stored locally
 */
export class GifCollections extends AbstractStore<
  "gifCollections",
  TypeGifCollections
> {
  constructor(state: State) {
    super(state, "gifCollections");
  }

  hydrate(): void {
    /** nothing needs to be done */
  }

  default(): TypeGifCollections {
    return {
      collections: [],
      favourites: [],
    };
  }

  clean(input: Partial<TypeGifCollections>): TypeGifCollections {
    const data = this.default();

    if (Array.isArray(input.collections)) {
      data.collections = input.collections.filter(
        (c) =>
          typeof c.id === "string" &&
          typeof c.name === "string" &&
          Array.isArray(c.gifs),
      );
    }

    if (Array.isArray(input.favourites)) {
      data.favourites = input.favourites.filter(
        (g) => typeof g.url === "string",
      );
    }

    return data;
  }

  /** Create a new collection */
  createCollection(name: string): string {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const collection: GifCollection = {
      id,
      name,
      gifs: [],
      createdAt: new Date().toISOString(),
    };
    this.set("collections", (prev) => [...prev, collection]);
    return id;
  }

  /** Delete a collection */
  deleteCollection(id: string) {
    this.set("collections", (prev) => prev.filter((c) => c.id !== id));
  }

  /** Rename a collection */
  renameCollection(id: string, name: string) {
    this.set("collections", (c) => c.id === id, "name", name);
  }

  /** Add a GIF to a collection */
  addGif(collectionId: string, url: string, name?: string) {
    const gif: GifItem = {
      url,
      name,
      addedAt: new Date().toISOString(),
    };
    this.set("collections", (c) => c.id === collectionId, "gifs", (prev) => [
      ...prev,
      gif,
    ]);
  }

  /** Remove a GIF from a collection */
  removeGif(collectionId: string, url: string) {
    this.set("collections", (c) => c.id === collectionId, "gifs", (prev) =>
      prev.filter((g) => g.url !== url),
    );
  }

  /** Add GIF to favourites */
  addFavourite(url: string, name?: string) {
    const existing = this.get().favourites.find((g) => g.url === url);
    if (existing) return;
    this.set("favourites", (prev) => [
      ...prev,
      { url, name, addedAt: new Date().toISOString() },
    ]);
  }

  /** Remove GIF from favourites */
  removeFavourite(url: string) {
    this.set("favourites", (prev) => prev.filter((g) => g.url !== url));
  }

  /** Check if a GIF is in favourites */
  isFavourite(url: string): boolean {
    return this.get().favourites.some((g) => g.url === url);
  }

  /** Get all collections */
  get collections(): GifCollection[] {
    return this.get().collections;
  }

  /** Get favourites */
  get favourites(): GifItem[] {
    return this.get().favourites;
  }
}
