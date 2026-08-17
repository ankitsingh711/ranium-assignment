import type { BookDetail, BookSummary, ShortlistItem } from '~/types/book'

const STORAGE_KEY = 'shelf:shortlist'

// Module-level, but only ever read/written on the client, where a module is
// truly a per-tab singleton — safe, unlike sharing reactive *state* this way.
let hydratedFromStorage = false

function persist(items: ShortlistItem[]) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage may be full or disabled (e.g. private browsing) — fail silently.
  }
}

export function useShortlist() {
  // useState (not a module-level ref) so the list is request-scoped on the
  // server and a shared singleton on the client — a plain module-level ref
  // would be reused across every SSR request on the same server process.
  const items = useState<ShortlistItem[]>('shortlist', () => [])

  if (import.meta.client && !hydratedFromStorage) {
    hydratedFromStorage = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) items.value = JSON.parse(raw) as ShortlistItem[]
    } catch {
      // Corrupt/blocked storage — start from an empty shortlist rather than crashing.
    }
  }

  const isShortlisted = (id: string) => items.value.some((item) => item.id === id)

  function add(book: BookSummary | BookDetail) {
    if (isShortlisted(book.id)) return
    items.value = [
      ...items.value,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        firstPublishYear: book.firstPublishYear,
        addedAt: Date.now()
      }
    ]
    persist(items.value)
  }

  function remove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
    persist(items.value)
  }

  function toggle(book: BookSummary | BookDetail) {
    if (isShortlisted(book.id)) remove(book.id)
    else add(book)
  }

  return {
    items: computed(() => items.value),
    isShortlisted,
    add,
    remove,
    toggle
  }
}
