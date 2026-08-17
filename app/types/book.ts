export interface BookSummary {
  id: string
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

/**
 * Apple's iTunes Search/Lookup API, filtered to ebooks — the sole data
 * source. It has no publisher or page-count fields at all, which is
 * reflected by always mapping those to null rather than guessing.
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
