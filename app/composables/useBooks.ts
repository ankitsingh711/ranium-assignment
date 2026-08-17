import type {
  BookDetail,
  BookSummary,
  ItunesBookResult,
  ItunesSearchResponse,
  OpenLibraryAuthor,
  OpenLibraryEditionsResponse,
  OpenLibrarySearchResponse,
  OpenLibraryWork
} from '~/types/book'
import { coverUrl, workIdFromKey } from '~/utils/covers'

// ofetch's own `timeout` option is silently ignored whenever a custom
// `signal` is also passed, so every timeout below that also needs a
// `signal` (i.e. the two search calls, which can be cancelled by a newer
// search) is driven manually via setTimeout + AbortController instead.
const OPEN_LIBRARY_TIMEOUT_MS = 5_000
const ITUNES_TIMEOUT_MS = 5_000

const ITUNES_ID_PREFIX = 'it_'

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

function parseYear(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const year = Number.parseInt(String(value).slice(0, 4), 10)
  return Number.isNaN(year) ? null : year
}

// iTunes only gives back a 100x100 thumbnail URL; the size is encoded in the
// path itself, so a bigger one is requested by rewriting that segment.
function upscaleArtwork(url: string | undefined): string | null {
  if (!url) return null
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1')
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' '
}

// iTunes descriptions come back as HTML (`<b>`, `<i>`, `<br />`), which the
// template renders as plain text (correctly — no `v-html`, no XSS risk from
// third-party content) — so tags need stripping here rather than in markup.
function stripHtml(html: string | undefined): string | null {
  if (!html) return null
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function mapItunesResult(item: ItunesBookResult): BookSummary {
  return {
    id: `${ITUNES_ID_PREFIX}${item.trackId}`,
    title: item.trackName ?? 'Untitled',
    author: item.artistName ?? null,
    firstPublishYear: parseYear(item.releaseDate ?? null),
    coverUrl: upscaleArtwork(item.artworkUrl100),
    source: 'itunes'
  }
}

function abortAfter(controller: AbortController, ms: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => controller.abort(), ms)
}

async function searchItunesBooks(query: string, signal: AbortSignal): Promise<BookSummary[]> {
  const data = await $fetch<ItunesSearchResponse>('https://itunes.apple.com/search', {
    params: { term: query, media: 'ebook', limit: 24 },
    signal,
    // iTunes serves its JSON as `Content-Type: text/javascript`, which
    // ofetch's automatic content-type sniffing doesn't recognize as JSON —
    // without this it silently hands back an unparsed string instead.
    responseType: 'json'
  })
  return (data.results ?? []).map(mapItunesResult)
}

export function useBooks() {
  // useState (not a plain ref) so search results survive navigating to a
  // book's detail page and back — the search page unmounts on navigation,
  // which would otherwise reset a plain ref back to empty on every return
  // trip, forcing a full re-search (and re-triggering the Open Library ->
  // fallback timeout dance) just to look at results the user already had.
  const searchLoading = useState('book-search-loading', () => false)
  const searchError = useState<string | null>('book-search-error', () => null)
  const usedFallback = useState('book-search-used-fallback', () => false)
  const results = useState<BookSummary[]>('book-search-results', () => [])

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

    const olTimeoutId = abortAfter(controller, OPEN_LIBRARY_TIMEOUT_MS)
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
      // Open Library failed or timed out — fall through to the iTunes fallback below.
    }

    const fallbackController = new AbortController()
    const itunesTimeoutId = abortAfter(fallbackController, ITUNES_TIMEOUT_MS)
    try {
      results.value = await searchItunesBooks(trimmed, fallbackController.signal)
      if (!isCurrent()) return
      usedFallback.value = true
    } catch {
      if (!isCurrent()) return
      results.value = []
      searchError.value = 'Could not reach Open Library or Apple Books. Check your connection and try again.'
    } finally {
      clearTimeout(itunesTimeoutId)
      if (isCurrent()) searchLoading.value = false
    }
  }

  return { results, searchLoading, searchError, usedFallback, searchBooks }
}

async function getOpenLibraryDetail(id: string): Promise<BookDetail> {
  let work: OpenLibraryWork
  try {
    work = await $fetch<OpenLibraryWork>(`https://openlibrary.org/works/${id}.json`, {
      timeout: OPEN_LIBRARY_TIMEOUT_MS
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
        timeout: OPEN_LIBRARY_TIMEOUT_MS
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
      { params: { limit: 5 }, timeout: OPEN_LIBRARY_TIMEOUT_MS }
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

async function getItunesDetail(trackId: string): Promise<BookDetail> {
  let data: ItunesSearchResponse
  try {
    data = await $fetch<ItunesSearchResponse>('https://itunes.apple.com/lookup', {
      params: { id: trackId },
      timeout: ITUNES_TIMEOUT_MS,
      responseType: 'json'
    })
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Apple Books is unavailable' })
  }

  // A non-existent id returns HTTP 200 with an empty `results` array rather
  // than a 404, so an empty array is the actual not-found signal here.
  const item = data.results?.[0]
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  const cover = upscaleArtwork(item.artworkUrl100)

  return {
    id: `${ITUNES_ID_PREFIX}${item.trackId}`,
    title: item.trackName ?? 'Untitled',
    author: item.artistName ?? null,
    firstPublishYear: parseYear(item.releaseDate ?? null),
    description: stripHtml(item.description),
    // iTunes' ebook results carry no publisher or page-count fields at all.
    publisher: null,
    pageCount: null,
    subjects: item.genres ?? [],
    coverUrl: cover,
    coverUrlLarge: cover,
    source: 'itunes'
  }
}

export async function getBookDetail(id: string): Promise<BookDetail> {
  if (id.startsWith(ITUNES_ID_PREFIX)) {
    return getItunesDetail(id.slice(ITUNES_ID_PREFIX.length))
  }
  return getOpenLibraryDetail(id)
}
