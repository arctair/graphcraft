import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
interface Ingredient {
  type: string
  displayName: string
  unlocalizedName: string
}

interface Wrapper {
  type: string
  outputIngredients: Array<Array<Ingredient>>
}

interface Category {
  title: string
  recipes: Array<Wrapper>
}

export interface Recipes {
  categories: Array<Category>
}

interface RecipeContextValue {
  recipes: Recipes
  error: string
}
const recipeContext = createContext<RecipeContextValue>({
  recipes: { categories: [] },
  error: '',
})

interface RecipesProviderProps {
  children: ReactNode
}
export function RecipesProvider({ children }: RecipesProviderProps) {
  const [recipes, setRecipes] = useState<any>()
  const [error, setError] = useState('')
  useEffect(() => {
    ;(async function () {
      const response = await fetch(
        'https://graphcraft.cruftbusters.com/recipes-v1.json',
      )
      if (response.status < 200 || response.status > 299) {
        setError(
          `got status ${response.statusText} while fetching /recipes-v1.json`,
        )
      } else {
        const recipes = await response.json()
        setRecipes({
          ...recipes,
          categories: recipes.categories.filter(
            (category: any, i: number) =>
              recipes.categories
                .map((category: any) => category.title)
                .indexOf(category.title) === i,
          ),
        })
      }
    })()
  }, [])
  return (
    <recipeContext.Provider
      value={{ recipes, error }}
      children={children}
    />
  )
}

export function useRecipes() {
  return useContext(recipeContext)
}
