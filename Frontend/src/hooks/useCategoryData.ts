import { useEffect, useState } from 'react'
import { getCategoryContent } from '../services/contentService'

export function useCategoryData(category: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getCategoryContent(category)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [category])

  return { data, loading, error }
}
