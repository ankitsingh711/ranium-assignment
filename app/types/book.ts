export type BookSource = 'openlibrary' | 'archive'

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
 * Fallback data source, used only when Open Library is unreachable. Many
 * fields on Internet Archive's items are inconsistently either a single
 * string or an array of strings, which is reflected below rather than
 * normalized away, so the mapping layer has to handle both explicitly.
 */
export interface ArchiveOrgSearchDoc {
  identifier: string
  title?: string
  creator?: string | string[]
  year?: string | number
}

export interface ArchiveOrgSearchResponse {
  response?: {
    docs: ArchiveOrgSearchDoc[]
  }
}

export interface ArchiveOrgMetadata {
  identifier?: string
  title?: string
  creator?: string | string[]
  description?: string | string[]
  publisher?: string | string[]
  year?: string | number
  date?: string
  subject?: string | string[]
  imagecount?: string | number
}

export interface ArchiveOrgMetadataResponse {
  metadata?: ArchiveOrgMetadata
}
