import { useEffect, useState } from 'react'
import {
  Recipes,
  RecipesProvider,
  useRecipes,
} from './components/RecipesContext'

export default function App() {
  return (
    <RecipesProvider>
      <SearchRecipes />
    </RecipesProvider>
  )
}

function SearchRecipes() {
  const { recipes, error } = useRecipes()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Recipes>()
  useEffect(() => {
    if (!searchTerm) {
      setResults(undefined)
    } else {
      setResults({
        ...recipes,
        categories: recipes.categories
          .map((category) => ({
            ...category,
            recipes: category.recipes.filter((recipe) =>
              recipe.outputIngredients.some((outputIngredient) =>
                outputIngredient
                  .flat()
                  .some(
                    (ingredient) =>
                      ingredient?.displayName
                        ?.toLowerCase()
                        ?.indexOf(searchTerm.toLowerCase()) > -1,
                  ),
              ),
            ),
          }))
          .filter((category) => category.recipes.length > 0),
      })
    }
  }, [recipes, searchTerm])
  return error ? (
    <div style={{ backgroundColor: 'red' }}>{error}</div>
  ) : recipes ? (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {results?.categories.map((category) => (
        <div key={category.title}>
          <h2>{category.title}</h2>
          {category.recipes.map((recipe, i) => (
            <div
              key={`${category.title}-${i}`}
              style={{ marginBottom: '0.25rem' }}
            >
              {JSON.stringify(recipe)}
            </div>
          ))}
        </div>
      ))}
    </div>
  ) : (
    <div>loading</div>
  )
}
