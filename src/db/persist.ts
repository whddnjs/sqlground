import { del, get, set } from 'idb-keyval'

const DB_KEY = 'sqlground:db'

export function loadDb(): Promise<Uint8Array | undefined> {
  return get<Uint8Array>(DB_KEY)
}

export function saveDb(data: Uint8Array): Promise<void> {
  return set(DB_KEY, data)
}

export function clearDb(): Promise<void> {
  return del(DB_KEY)
}
