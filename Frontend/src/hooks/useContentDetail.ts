import { useEffect, useState } from 'react'
import { getContentDetail } from '../services/contentDetailService'

export function useContentDetail(id: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getContentDetail(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}
