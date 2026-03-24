// ============================================
// LAB 6 — Задача 2: Custom Hook useFetch
// Принимает URL и возвращает данные, состояние загрузки и ошибки.
// Автоматически отправляет запрос при монтировании / смене URL.
// Поддерживает AbortController для отмены «зависших» запросов.
// ============================================
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * @param {string|null} url — URL для запроса (null — не запрашивать)
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Храним контроллер, чтобы отменять предыдущий запрос при смене URL
  const abortRef = useRef(null)

  const fetchData = useCallback(async (fetchUrl) => {
    if (!fetchUrl) return

    // Отменяем предыдущий незавершённый запрос
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
      // Игнорируем ошибку отмены (AbortError) — это штатная ситуация
      if (err.name !== 'AbortError') {
        setError(err.message || 'Неизвестная ошибка')
      }
    } finally {
      // Помечаем загрузку завершённой только если запрос не был отменён
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // Запускаем запрос автоматически при монтировании и при смене URL
  useEffect(() => {
    if (url) fetchData(url)

    // Cleanup: отменить запрос при размонтировании
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [url, fetchData])

  // refetch позволяет повторить запрос вручную (напр. после ошибки)
  const refetch = useCallback(() => fetchData(url), [url, fetchData])

  return { data, loading, error, refetch }
}
