export function googleBooksSearchUrl(query: string): string {
  return `https://books.google.com/books?q=${encodeURIComponent(query)}`
}
