import { useEffect, useState } from 'react'
import { getContentsByCategory, ContentType } from '../services/contentService'

export function useCategoryData(category: ContentType) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getContentsByCategory(category as ContentType)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [category])

  return { data, loading, error }
}
