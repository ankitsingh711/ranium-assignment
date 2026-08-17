import type { BookDetail, BookSummary, ItunesBookResult, ItunesSearchResponse } from '~/types/book'

// ofetch's own `timeout` option is silently ignored whenever a custom
// `signal` is also passed, so the search timeout is driven manually via
// setTimeout + AbortController instead. The detail fetch doesn't pass a
// signal, so it can use ofetch's `timeout` option directly.
const REQUEST_TIMEOUT_MS = 5_000

function parseYear(value: string | undefined): number | null {
  if (!value) return null
  const year = Number.parseInt(value.slice(0, 4), 10)
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
    id: String(item.trackId),
    title: item.trackName ?? 'Untitled',
    author: item.artistName ?? null,
    firstPublishYear: parseYear(item.releaseDate),
    coverUrl: upscaleArtwork(item.artworkUrl100)
  }
}

export function useBooks() {
  // useState (not a plain ref) so search results survive navigating to a
  // book's detail page and back — the search page unmounts on navigation,
  // which would otherwise reset a plain ref back to empty on every return
  // trip, forcing a full re-search.
  const searchLoading = useState('book-search-loading', () => false)
  const searchError = useState<string | null>('book-search-error', () => null)
  const results = useState<BookSummary[]>('book-search-results', () => [])

  let activeController: AbortController | null = null

  async function searchBooks(query: string) {
    const trimmed = query.trim()
    if (!trimmed) {
      results.value = []
      searchError.value = null
      return
    }

    // Cancel any in-flight search before starting a new one.
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    const isCurrent = () => activeController === controller
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    searchLoading.value = true
    searchError.value = null

    try {
      const data = await $fetch<ItunesSearchResponse>('https://itunes.apple.com/search', {
        params: { term: trimmed, media: 'ebook', limit: 24 },
        signal: controller.signal,
        // iTunes serves its JSON as `Content-Type: text/javascript`, which
        // ofetch's automatic content-type sniffing doesn't recognize as
        // JSON — without this it silently hands back an unparsed string.
        responseType: 'json'
      })
      if (!isCurrent()) return
      results.value = (data.results ?? []).map(mapItunesResult)
    } catch {
      if (!isCurrent()) return
      results.value = []
      searchError.value = 'Could not reach Apple Books. Check your connection and try again.'
    } finally {
      clearTimeout(timeoutId)
      if (isCurrent()) searchLoading.value = false
    }
  }

  return { results, searchLoading, searchError, searchBooks }
}

export async function getBookDetail(id: string): Promise<BookDetail> {
  let data: ItunesSearchResponse
  try {
    data = await $fetch<ItunesSearchResponse>('https://itunes.apple.com/lookup', {
      params: { id },
      timeout: REQUEST_TIMEOUT_MS,
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
    id: String(item.trackId),
    title: item.trackName ?? 'Untitled',
    author: item.artistName ?? null,
    firstPublishYear: parseYear(item.releaseDate),
    description: stripHtml(item.description),
    // iTunes' ebook results carry no publisher or page-count fields at all.
    publisher: null,
    pageCount: null,
    subjects: item.genres ?? [],
    coverUrl: cover,
    coverUrlLarge: cover
  }
}
