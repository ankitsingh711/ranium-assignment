import type { BookDetail, BookSummary, ShortlistItem } from '~/types/book'

const STORAGE_KEY = 'shelf:shortlist'

// Module-level state so every component shares the same reactive list
// instead of each `useShortlist()` call owning its own copy.
const items = ref<ShortlistItem[]>([])
let hydrated = false

function hydrate() {
  if (hydrated || !import.meta.client) return
  hydrated = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) items.value = JSON.parse(raw) as ShortlistItem[]
  } catch {
    // Corrupt/blocked storage — start from an empty shortlist rather than crashing.
    items.value = []
  }
}

function persist() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  } catch {
    // Storage may be full or disabled (e.g. private browsing) — fail silently.
  }
}

export function useShortlist() {
  hydrate()

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
    persist()
  }

  function remove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
    persist()
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
