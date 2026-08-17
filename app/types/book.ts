export type BookSource = 'openlibrary' | 'itunes'

export interface BookSummary {
  id: string
  title: string
  author: string | null
  firstPublishYear: number | null
  coverUrl: string | null
  source: BookSource
}

export interface BookDetail extends BookSummary {
  description: string | null
  publisher: string | null
  pageCount: number | null
  subjects: string[]
  coverUrlLarge: string | null
}

export interface ShortlistItem {
  id: string
  title: string
  author: string | null
  coverUrl: string | null
  firstPublishYear: number | null
  addedAt: number
}

export interface OpenLibrarySearchDoc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
}

export interface OpenLibrarySearchResponse {
  numFound: number
  docs: OpenLibrarySearchDoc[]
}

export interface OpenLibraryWork {
  key: string
  title: string
  description?: string | { type: string; value: string }
  covers?: number[]
  subjects?: string[]
  authors?: Array<{ author: { key: string } }>
}

export interface OpenLibraryAuthor {
  name?: string
}

export interface OpenLibraryEdition {
  publishers?: string[]
  number_of_pages?: number
}

export interface OpenLibraryEditionsResponse {
  entries: OpenLibraryEdition[]
}

/**
 * Fallback data source, used only when Open Library is unreachable. This is
 * Apple's iTunes Search/Lookup API filtered to ebooks — it has no publisher
 * or page-count fields at all (unlike Open Library), which is reflected by
 * always mapping those to null for this source rather than guessing.
 */
export interface ItunesBookResult {
  trackId: number
  trackName?: string
  artistName?: string
  releaseDate?: string
  description?: string
  artworkUrl100?: string
  genres?: string[]
}

export interface ItunesSearchResponse {
  resultCount: number
  results: ItunesBookResult[]
}
