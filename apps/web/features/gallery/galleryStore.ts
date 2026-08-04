export interface GalleryItem {
  id: string;
  createdAt: number;
  title: string;
  mode: "solo" | "together" | "event";
  image: Blob;
  expiresAt?: number;
}

const DATABASE = "joyshot-gallery";
const STORE = "keepsakes";

function openGallery() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The private gallery could not be opened."));
  });
}

function runRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return openGallery().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The gallery request failed."));
    transaction.oncomplete = () => database.close();
  }));
}

export async function dataUrlToBlob(dataUrl: string) {
  return fetch(dataUrl).then((response) => response.blob());
}

export async function saveGalleryItem(imageUrl: string, title: string, mode: GalleryItem["mode"], retentionHours = 0) {
  const item: GalleryItem = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    title: title.trim() || "JoyShot keepsake",
    mode,
    image: await dataUrlToBlob(imageUrl),
    expiresAt: retentionHours > 0 ? Date.now() + retentionHours * 60 * 60 * 1_000 : undefined,
  };
  await runRequest("readwrite", (store) => store.put(item));
  return item;
}

export function listGalleryItems() {
  return runRequest<GalleryItem[]>("readonly", (store) => store.getAll())
    .then(async (items) => {
      const expired = items.filter(({ expiresAt }) => expiresAt !== undefined && expiresAt <= Date.now());
      await Promise.all(expired.map(({ id }) => deleteGalleryItem(id)));
      return items.filter(({ expiresAt }) => expiresAt === undefined || expiresAt > Date.now()).sort((a, b) => b.createdAt - a.createdAt);
    });
}

export function deleteGalleryItem(id: string) {
  return runRequest("readwrite", (store) => store.delete(id));
}

export function clearGallery() {
  return runRequest("readwrite", (store) => store.clear());
}
