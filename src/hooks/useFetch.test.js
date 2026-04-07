import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch } from './useFetch'

function mockFetchSuccess(data) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data)
  })
}

function mockFetchError(status = 500, statusText = 'Internal Server Error') {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText
  })
}

function mockFetchNetworkError(message = 'Network failure') {
  global.fetch = vi.fn().mockRejectedValue(new Error(message))
}


describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })


  it('возвращает null data и false loading при url=null', () => {
    const { result } = renderHook(() => useFetch(null))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })


  it('выставляет loading=true сразу после вызова с URL', async () => {
    let resolveFetch
    global.fetch = vi.fn().mockReturnValue(
      new Promise(resolve => { resolveFetch = resolve })
    )

    const { result } = renderHook(() => useFetch('https://api.test/data'))
    expect(result.current.loading).toBe(true)

    resolveFetch({ ok: true, json: () => Promise.resolve({}) })
    await waitFor(() => expect(result.current.loading).toBe(false))
  })


  it('сохраняет полученные данные в data', async () => {
    const mockData = { meals: [{ idMeal: '1', strMeal: 'Pasta' }] }
    mockFetchSuccess(mockData)

    const { result } = renderHook(() => useFetch('https://api.test/meals'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('после успешного запроса loading=false', async () => {
    mockFetchSuccess({ items: [] })

    const { result } = renderHook(() => useFetch('https://api.test/items'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.loading).toBe(false)
  })

  it('записывает ошибку в error при HTTP статусе ≥ 400', async () => {
    mockFetchError(404, 'Not Found')

    const { result } = renderHook(() => useFetch('https://api.test/missing'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toContain('404')
    expect(result.current.data).toBeNull()
  })

  it('записывает ошибку 500', async () => {
    mockFetchError(500, 'Internal Server Error')

    const { result } = renderHook(() => useFetch('https://api.test/crash'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('500')
  })

  it('обрабатывает сетевую ошибку (fetch rejected)', async () => {
    mockFetchNetworkError('Network failure')

    const { result } = renderHook(() => useFetch('https://api.test/offline'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network failure')
    expect(result.current.data).toBeNull()
  })

  it('вызывает fetch с переданным URL', async () => {
    mockFetchSuccess({})
    const url = 'https://api.test/recipes?s=pasta'

    renderHook(() => useFetch(url))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    ))
  })

  it('refetch повторяет запрос и обновляет данные', async () => {
    mockFetchSuccess({ count: 1 })
    const { result } = renderHook(() => useFetch('https://api.test/count'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockFetchSuccess({ count: 2 })

    await result.current.refetch()
    await waitFor(() => expect(result.current.data).toEqual({ count: 2 }))
  })


  it('refetch — это функция', () => {
    mockFetchSuccess({})
    const { result } = renderHook(() => useFetch('https://api.test'))
    expect(typeof result.current.refetch).toBe('function')
  })
})
