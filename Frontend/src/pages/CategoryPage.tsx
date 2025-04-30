import React from 'react'
import { useParams } from 'react-router-dom'
import { useCategoryData } from '../hooks/useCategoryData'
import ContentGrid from '../components/ContentGrid'

const CATEGORY_LABELS: Record<string, string> = {
  dramas: 'Dramas',
  movies: 'Films',
  anime: 'Animés',
  bollywood: 'Bollywood',
  trending: 'Tendances',
}

const CategoryPage: React.FC = () => {
  const { categoryName = '' } = useParams<{ categoryName: string }>()
  const { data, loading, error } = useCategoryData(categoryName)
  const title = CATEGORY_LABELS[categoryName] || categoryName

  return (
    <main className="py-8 px-2 md:px-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent text-center">{title}</h1>
      {loading && <div className="text-flo-white text-center">Chargement...</div>}
      {error && <div className="text-red-400 text-center">Erreur : {error}</div>}
      {!loading && !error && (
        <ContentGrid title={title} category={categoryName} />
      )}
    </main>
  )
}

export default CategoryPage
