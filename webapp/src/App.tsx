import { ReactNode, useEffect, useState } from 'react'
import {
  Ingredient,
  RecipesProvider,
  useRecipes,
  WrappersByCategoryTitle,
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
        ingredients.filter(
          (ingredient) =>
            (ingredient.localizedName &&
              ingredient.localizedName
                .toLowerCase()
                .includes(searchTermLower)) ||
            (ingredient.unlocalizedName &&
              ingredient.unlocalizedName
                .toLowerCase()
                .includes(searchTermLower)),
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
          <IngredientView key={ingredient.id} ingredient={ingredient} />
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
  const [isExpanded, setIsExpanded] = useState(false)
  const { wrappersByCategoryTitleByID } = useRecipes()
  return ingredient === null ? (
    <div>empty slot</div>
  ) : (
    <div>
      <div>
        {ingredient.localizedName} ({ingredient.id}){' '}
        <button
          onClick={() => setIsExpanded((isExpanded) => !isExpanded)}
          style={{
            backgroundColor: 'inherit',
            color: 'gray',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isExpanded ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      {isExpanded
        ? Array.from(
            (
              wrappersByCategoryTitleByID.get(ingredient.id) ||
              (new Map() as WrappersByCategoryTitle)
            ).entries(),
          ).map(([categoryTitle, wrappers], i) => (
            <Indent key={i}>
              {categoryTitle}
              {wrappers.map((wrapper, i) => (
                <Indent key={i}>
                  {wrapper.type}
                  <Indent>
                    Inputs:
                    <Indent>
                      {wrapper.inputSlots.map((slot, i) => (
                        <Indent key={i}>
                          slot:
                          <Indent>
                            {slot.map((ingredient, i) => (
                              <IngredientView
                                key={i}
                                ingredient={ingredient}
                              />
                            ))}
                          </Indent>
                        </Indent>
                      ))}
                    </Indent>
                  </Indent>
                  <Indent>
                    Outputs:
                    <Indent>
                      {wrapper.outputSlots.map((slot, i) => (
                        <Indent key={i}>
                          slot:
                          <Indent>
                            {slot.map((ingredient, i) => (
                              <IngredientView
                                key={i}
                                ingredient={ingredient}
                              />
                            ))}
                          </Indent>
                        </Indent>
                      ))}
                    </Indent>
                  </Indent>
                </Indent>
              ))}
            </Indent>
          ))
        : undefined}
    </div>
  )
}

interface IndentProps {
  paddingLeft?: string
  children?: ReactNode
}
function Indent({ paddingLeft = '0.25rem', children }: IndentProps) {
  return <div style={{ paddingLeft }} children={children} />
}
