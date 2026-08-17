import type {
  BookDetail,
  BookSummary,
  OpenLibraryAuthor,
  OpenLibraryEditionsResponse,
  OpenLibrarySearchResponse,
  OpenLibraryWork
} from '~/types/book'
import { coverUrl, workIdFromKey } from '~/utils/covers'

function mapSearchDoc(doc: OpenLibrarySearchResponse['docs'][number]): BookSummary {
  return {
    id: workIdFromKey(doc.key),
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
    coverUrl: coverUrl(doc.cover_i, 'M')
  }
}

function describeWork(description: OpenLibraryWork['description']): string | null {
  if (!description) return null
  if (typeof description === 'string') return description
  return description.value ?? null
}

export function useBooks() {
  const searchLoading = ref(false)
  const searchError = ref<string | null>(null)
  const results = ref<BookSummary[]>([])

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

    searchLoading.value = true
    searchError.value = null

    try {
      const data = await $fetch<OpenLibrarySearchResponse>('https://openlibrary.org/search.json', {
        params: {
          q: trimmed,
          fields: 'key,title,author_name,first_publish_year,cover_i',
          limit: 24
        },
        signal: controller.signal
      })
      results.value = data.docs.map(mapSearchDoc)
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      results.value = []
      searchError.value = 'Something went wrong while searching. Please try again.'
    } finally {
      if (activeController === controller) {
        searchLoading.value = false
      }
    }
  }

  return { results, searchLoading, searchError, searchBooks }
}

export async function getBookDetail(id: string): Promise<BookDetail> {
  let work: OpenLibraryWork
  try {
    work = await $fetch<OpenLibraryWork>(`https://openlibrary.org/works/${id}.json`)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  let author: string | null = null
  const authorKey = work.authors?.[0]?.author?.key
  if (authorKey) {
    try {
      const authorData = await $fetch<OpenLibraryAuthor>(`https://openlibrary.org${authorKey}.json`)
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
      { params: { limit: 5 } }
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
    coverUrlLarge: coverUrl(work.covers?.[0], 'L')
  }
}
