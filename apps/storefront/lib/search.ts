export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

export interface SearchParams {
  q: string
  categoryId?: string
  sort: SortOption
  page: number
}

const VALID_SORTS: SortOption[] = ['newest', 'price_asc', 'price_desc', 'name_asc']

export function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const sortRaw = searchParams.get('ordem')
  const sort: SortOption = VALID_SORTS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : 'newest'

  const pageRaw = Number(searchParams.get('pagina'))
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  return {
    q: searchParams.get('q') ?? '',
    categoryId: searchParams.get('categoria') ?? undefined,
    sort,
    page,
  }
}

export function buildSearchUrl(params: SearchParams): string {
  const url = new URLSearchParams()
  if (params.q) url.set('q', params.q)
  if (params.categoryId) url.set('categoria', params.categoryId)
  if (params.sort !== 'newest') url.set('ordem', params.sort)
  if (params.page > 1) url.set('pagina', String(params.page))
  return `/busca?${url.toString()}`
}
