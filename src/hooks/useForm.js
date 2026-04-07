import { useState, useCallback, useRef } from 'react'

export function useForm(initialValues) {

  const initialRef = useRef(initialValues)

  const [values, setValuesState] = useState(initialValues)

  const handleChange = useCallback((field, value) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
  }, [])

  const reset = useCallback(() => {
    setValuesState(initialRef.current)
  }, [])

  const setValues = useCallback((newValues) => {
    setValuesState(newValues)
  }, [])

  return { values, handleChange, reset, setValues }
}
