import type {
  ArchiveOrgMetadataResponse,
  ArchiveOrgSearchDoc,
  ArchiveOrgSearchResponse,
  BookDetail,
  BookSummary,
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
// archive.org's search endpoint (advancedsearch.php) runs noticeably slower
// than Open Library's even when healthy — observed 2-7s round trips during
// development — so it gets a longer allowance before being treated as down.
const ARCHIVE_TIMEOUT_MS = 8_000

const ARCHIVE_ID_PREFIX = 'ia_'

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

// Internet Archive metadata fields are inconsistently either a bare string
// or an array of strings depending on the item, so every read of one goes
// through these instead of assuming a shape.
function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function firstOf(value: string | string[] | undefined): string | null {
  return toArray(value)[0] ?? null
}

function splitSubjects(value: string | string[] | undefined): string[] {
  return toArray(value)
    .flatMap((entry) => entry.split(';'))
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function archiveCoverUrl(identifier: string): string {
  return `https://archive.org/services/img/${identifier}`
}

function mapArchiveOrgDoc(doc: ArchiveOrgSearchDoc): BookSummary {
  return {
    id: `${ARCHIVE_ID_PREFIX}${doc.identifier}`,
    title: doc.title ?? 'Untitled',
    author: firstOf(doc.creator),
    firstPublishYear: parseYear(doc.year ?? null),
    coverUrl: archiveCoverUrl(doc.identifier),
    source: 'archive'
  }
}

function abortAfter(controller: AbortController, ms: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => controller.abort(), ms)
}

async function searchArchiveOrg(query: string, signal: AbortSignal): Promise<BookSummary[]> {
  // Built as a raw query string (not ofetch's `params` object) so the
  // repeated `fl[]=` keys advancedsearch.php expects are formed exactly.
  const qs = new URLSearchParams()
  qs.set('q', `${query} AND mediatype:(texts)`)
  for (const field of ['identifier', 'title', 'creator', 'year']) {
    qs.append('fl[]', field)
  }
  qs.set('rows', '24')
  qs.set('page', '1')
  qs.set('output', 'json')

  const data = await $fetch<ArchiveOrgSearchResponse>(
    `https://archive.org/advancedsearch.php?${qs.toString()}`,
    { signal }
  )
  return (data.response?.docs ?? []).map(mapArchiveOrgDoc)
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
      // Open Library failed or timed out — fall through to the Internet Archive fallback below.
    }

    const fallbackController = new AbortController()
    const iaTimeoutId = abortAfter(fallbackController, ARCHIVE_TIMEOUT_MS)
    try {
      results.value = await searchArchiveOrg(trimmed, fallbackController.signal)
      if (!isCurrent()) return
      usedFallback.value = true
    } catch {
      if (!isCurrent()) return
      results.value = []
      searchError.value = 'Could not reach Open Library or Internet Archive. Check your connection and try again.'
    } finally {
      clearTimeout(iaTimeoutId)
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

async function getArchiveOrgDetail(identifier: string): Promise<BookDetail> {
  let data: ArchiveOrgMetadataResponse
  try {
    data = await $fetch<ArchiveOrgMetadataResponse>(`https://archive.org/metadata/${identifier}`, {
      timeout: ARCHIVE_TIMEOUT_MS
    })
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Internet Archive is unavailable' })
  }

  // A non-existent identifier returns HTTP 200 with an empty body rather
  // than a 404, so "no title" is the actual not-found signal here.
  const metadata = data.metadata
  if (!metadata?.title) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  const cover = archiveCoverUrl(identifier)
  const pageCount = metadata.imagecount ? Number.parseInt(String(metadata.imagecount), 10) : null

  return {
    id: `${ARCHIVE_ID_PREFIX}${identifier}`,
    title: metadata.title,
    author: firstOf(metadata.creator),
    firstPublishYear: parseYear(metadata.year ?? metadata.date ?? null),
    description: firstOf(metadata.description),
    publisher: firstOf(metadata.publisher),
    pageCount: pageCount !== null && Number.isNaN(pageCount) ? null : pageCount,
    subjects: splitSubjects(metadata.subject),
    coverUrl: cover,
    coverUrlLarge: cover,
    source: 'archive'
  }
}

export async function getBookDetail(id: string): Promise<BookDetail> {
  if (id.startsWith(ARCHIVE_ID_PREFIX)) {
    return getArchiveOrgDetail(id.slice(ARCHIVE_ID_PREFIX.length))
  }
  return getOpenLibraryDetail(id)
}
