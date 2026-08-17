import type {
  BookDetail,
  BookSummary,
  GoogleBooksSearchResponse,
  GoogleBooksVolume,
  OpenLibraryAuthor,
  OpenLibraryEditionsResponse,
  OpenLibrarySearchResponse,
  OpenLibraryWork
} from '~/types/book'
import { coverUrl, workIdFromKey } from '~/utils/covers'

// ofetch's own `timeout` option is silently ignored whenever a custom
// `signal` is also passed, so every timeout below is driven manually via
// setTimeout + AbortController instead of relying on ofetch for it.
const REQUEST_TIMEOUT_MS = 5_000

const GOOGLE_BOOKS_ID_PREFIX = 'gb_'

function mapOpenLibrarySearchDoc(doc: OpenLibrarySearchResponse['docs'][number]): BookSummary {
  return {
    id: workIdFromKey(doc.key),
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
    coverUrl: coverUrl(doc.cover_i, 'M'),
    source: 'openlibrary'
  }
}

function describeWork(description: OpenLibraryWork['description']): string | null {
  if (!description) return null
  if (typeof description === 'string') return description
  return description.value ?? null
}

function parseYear(publishedDate: string | undefined): number | null {
  if (!publishedDate) return null
  const year = Number.parseInt(publishedDate.slice(0, 4), 10)
  return Number.isNaN(year) ? null : year
}

// Google's cover thumbnail URLs are frequently http:// and get blocked as
// mixed content on an https page.
function toHttps(url: string | undefined): string | null {
  if (!url) return null
  return url.replace(/^http:\/\//, 'https://')
}

function mapGoogleBooksVolume(volume: GoogleBooksVolume): BookSummary {
  const info = volume.volumeInfo ?? {}
  return {
    id: `${GOOGLE_BOOKS_ID_PREFIX}${volume.id}`,
    title: info.title ?? 'Untitled',
    author: info.authors?.[0] ?? null,
    firstPublishYear: parseYear(info.publishedDate),
    coverUrl: toHttps(info.imageLinks?.thumbnail),
    source: 'googlebooks'
  }
}

function abortAfter(controller: AbortController, ms: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => controller.abort(), ms)
}

async function searchGoogleBooks(query: string, signal: AbortSignal): Promise<BookSummary[]> {
  const data = await $fetch<GoogleBooksSearchResponse>('https://www.googleapis.com/books/v1/volumes', {
    params: { q: query, maxResults: 24 },
    signal
  })
  return (data.items ?? []).map(mapGoogleBooksVolume)
}

export function useBooks() {
  const searchLoading = ref(false)
  const searchError = ref<string | null>(null)
  const usedFallback = ref(false)
  const results = ref<BookSummary[]>([])

  let activeController: AbortController | null = null

  async function searchBooks(query: string) {
    const trimmed = query.trim()
    if (!trimmed) {
      results.value = []
      searchError.value = null
      usedFallback.value = false
      return
    }

    // Cancel any in-flight search before starting a new one.
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    const isCurrent = () => activeController === controller

    searchLoading.value = true
    searchError.value = null
    usedFallback.value = false

    const olTimeoutId = abortAfter(controller, REQUEST_TIMEOUT_MS)
    try {
      const data = await $fetch<OpenLibrarySearchResponse>('https://openlibrary.org/search.json', {
        params: {
          q: trimmed,
          fields: 'key,title,author_name,first_publish_year,cover_i',
          limit: 24
        },
        signal: controller.signal
      })
      clearTimeout(olTimeoutId)
      if (!isCurrent()) return
      results.value = data.docs.map(mapOpenLibrarySearchDoc)
      searchLoading.value = false
      return
    } catch {
      clearTimeout(olTimeoutId)
      if (!isCurrent()) return
      // Open Library failed or timed out — fall through to the Google Books fallback below.
    }

    const fallbackController = new AbortController()
    const gbTimeoutId = abortAfter(fallbackController, REQUEST_TIMEOUT_MS)
    try {
      results.value = await searchGoogleBooks(trimmed, fallbackController.signal)
      if (!isCurrent()) return
      usedFallback.value = true
    } catch {
      if (!isCurrent()) return
      results.value = []
      searchError.value = 'Could not reach Open Library or Google Books. Check your connection and try again.'
    } finally {
      clearTimeout(gbTimeoutId)
      if (isCurrent()) searchLoading.value = false
    }
  }

  return { results, searchLoading, searchError, usedFallback, searchBooks }
}

async function getOpenLibraryDetail(id: string): Promise<BookDetail> {
  let work: OpenLibraryWork
  try {
    work = await $fetch<OpenLibraryWork>(`https://openlibrary.org/works/${id}.json`, {
      timeout: REQUEST_TIMEOUT_MS
    })
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Book not found' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Open Library is unavailable' })
  }

  let author: string | null = null
  const authorKey = work.authors?.[0]?.author?.key
  if (authorKey) {
    try {
      const authorData = await $fetch<OpenLibraryAuthor>(`https://openlibrary.org${authorKey}.json`, {
        timeout: REQUEST_TIMEOUT_MS
      })
      author = authorData.name ?? null
    } catch {
      // Author lookup is best-effort; UI falls back to "Unknown author".
    }
  }

  let publisher: string | null = null
  let pageCount: number | null = null
  try {
    const editions = await $fetch<OpenLibraryEditionsResponse>(
      `https://openlibrary.org/works/${id}/editions.json`,
      { params: { limit: 5 }, timeout: REQUEST_TIMEOUT_MS }
    )
    const withPublisher = editions.entries?.find((e) => e.publishers?.length)
    const withPages = editions.entries?.find((e) => e.number_of_pages)
    publisher = withPublisher?.publishers?.[0] ?? null
    pageCount = withPages?.number_of_pages ?? null
  } catch {
    // Editions are a best-effort enrichment; missing data is expected and handled by the UI.
  }

  return {
    id,
    title: work.title,
    author,
    firstPublishYear: null,
    description: describeWork(work.description),
    publisher,
    pageCount,
    subjects: work.subjects ?? [],
    coverUrl: coverUrl(work.covers?.[0], 'M'),
    coverUrlLarge: coverUrl(work.covers?.[0], 'L'),
    source: 'openlibrary'
  }
}

async function getGoogleBooksDetail(volumeId: string): Promise<BookDetail> {
  let volume: GoogleBooksVolume
  try {
    volume = await $fetch<GoogleBooksVolume>(`https://www.googleapis.com/books/v1/volumes/${volumeId}`, {
      timeout: REQUEST_TIMEOUT_MS
    })
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Book not found' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Google Books is unavailable' })
  }

  const info = volume.volumeInfo ?? {}
  return {
    id: `${GOOGLE_BOOKS_ID_PREFIX}${volume.id}`,
    title: info.title ?? 'Untitled',
    author: info.authors?.[0] ?? null,
    firstPublishYear: parseYear(info.publishedDate),
    description: info.description ?? null,
    publisher: info.publisher ?? null,
    pageCount: info.pageCount ?? null,
    subjects: info.categories ?? [],
    coverUrl: toHttps(info.imageLinks?.thumbnail),
    coverUrlLarge: toHttps(info.imageLinks?.large) ?? toHttps(info.imageLinks?.thumbnail),
    source: 'googlebooks'
  }
}

export async function getBookDetail(id: string): Promise<BookDetail> {
  if (id.startsWith(GOOGLE_BOOKS_ID_PREFIX)) {
    return getGoogleBooksDetail(id.slice(GOOGLE_BOOKS_ID_PREFIX.length))
  }
  return getOpenLibraryDetail(id)
}
