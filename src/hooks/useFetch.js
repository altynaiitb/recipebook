import { useState, useEffect, useCallback, useRef } from 'react'

export function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const abortRef = useRef(null)

  const fetchData = useCallback(async (fetchUrl) => {
    if (!fetchUrl) return

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(fetchUrl, { signal: controller.signal })

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()
      setData(json)
    } catch (err) {

      if (err.name !== 'AbortError') {
        setError(err.message || 'Неизвестная ошибка')
      }
    } finally {

      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (url) fetchData(url)

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [url, fetchData])

  const refetch = useCallback(() => fetchData(url), [url, fetchData])

  return { data, loading, error, refetch }
}
