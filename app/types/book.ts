/**
 * Application-level book types. These are deliberately narrower than the
 * raw Open Library API responses — only fields the UI actually uses are
 * kept, and every optional/inconsistent field is modeled as `| null`.
 */

export interface BookSummary {
  id: string // Open Library work id, e.g. "OL27448W"
  title: string
  author: string | null
  firstPublishYear: number | null
  coverUrl: string | null
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

/** Raw shapes from Open Library — kept minimal, only what we read. */

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
