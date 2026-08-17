export type BookSource = 'openlibrary' | 'googlebooks'

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
 * Fallback data source, used only when Open Library is unreachable. Kept to
 * the same minimal-fields-we-actually-use approach as the Open Library types.
 */
export interface GoogleBooksVolume {
  id: string
  volumeInfo?: {
    title?: string
    authors?: string[]
    publishedDate?: string
    description?: string
    publisher?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      large?: string
    }
  }
}

export interface GoogleBooksSearchResponse {
  items?: GoogleBooksVolume[]
}
