import { useEffect, useState } from 'react'
import {
  Ingredient,
  RecipesProvider,
  useRecipes,
} from './components/RecipesContext'

export default function App() {
  return (
    <RecipesProvider>
      <Fanout />
    </RecipesProvider>
  )
}

function Fanout() {
  const { error } = useRecipes()
  return error ? (
    <div style={{ backgroundColor: 'red' }}>{error}</div>
  ) : (
    <>
      <SearchIngredients />
    </>
  )
}

function SearchIngredients() {
  const { ingredients } = useRecipes()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Array<Ingredient>>([])
  useEffect(() => {
    if (!searchTerm || !ingredients) {
      setResults(ingredients || [])
    } else {
      const searchTermLower = searchTerm.toLowerCase()
      setResults(
        ingredients
          .filter((ingredient) => ingredient !== undefined)
          .filter(
            (ingredient) =>
              ingredient.displayName
                .toLowerCase()
                .indexOf(searchTermLower.toLowerCase()) > -1 ||
              ingredient.unlocalizedName
                .toLowerCase()
                .indexOf(searchTermLower.toLowerCase()) > -1,
          ),
      )
    }
  }, [ingredients, searchTerm])
  return ingredients ? (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          backgroundColor: '#AFF',
          padding: '0.25rem 1rem',
        }}
      >
        <input
          placeholder="Search items"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '0.25rem 1rem',
        }}
      >
        {results.map((ingredient) => (
          <IngredientView
            key={ingredient.unlocalizedName}
            ingredient={ingredient}
          />
        ))}
      </div>
    </div>
  ) : (
    <div>loading</div>
  )
}

interface IngredientViewProps {
  ingredient: Ingredient
}
function IngredientView({ ingredient }: IngredientViewProps) {
  return (
    <div>
      {ingredient.displayName} ({ingredient.unlocalizedName})
    </div>
  )
}
