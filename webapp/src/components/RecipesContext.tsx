import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export interface Ingredient {
  id: string
  type: string
  localizedName?: string
  unlocalizedName?: string
  metadata?: number
  count?: number
}

export interface Wrapper {
  type: string
  inputSlots: Array<Array<Ingredient>>
  outputSlots: Array<Array<Ingredient>>
}

interface Category {
  title: string
  wrappers: Array<Wrapper>
}

export interface Recipes {
  categories: Array<Category>
}

const RecipesEmpty: Recipes = {
  categories: [],
}

interface RecipeContextValue {
  recipes: Recipes
  ingredients: Array<Ingredient>
  searchWrappersByOutputIngredient: (
    ingredient: Ingredient,
  ) => Map<string, Wrapper[]>
  error: string
}
const recipeContext = createContext<RecipeContextValue>({
  recipes: { categories: [] },
  ingredients: [],
  searchWrappersByOutputIngredient: () => {
    throw new Error('No recipe context provider')
  },
  error: '',
})

interface RecipesProviderProps {
  children: ReactNode
}
export function RecipesProvider({ children }: RecipesProviderProps) {
  const [[recipes, ingredients], setRecipesAndIngredients] = useState<
    [Recipes, Array<Ingredient>]
  >([RecipesEmpty, []])
  const [error, setError] = useState('')
  useEffect(() => {
    ;(async function () {
      const [recipesV2, error] = await getRecipesV2()
      if (error) {
        setError(error)
        return
      }
      const recipes = uniqueCategories(recipesV2)
      const ingredients = getIngredients(recipes)

      setRecipesAndIngredients([recipes, Array.from(ingredients.values())])
    })()
  }, [])
  return (
    <recipeContext.Provider
      value={{
        recipes,
        ingredients,
        searchWrappersByOutputIngredient: useCallback(
          (ingredients) =>
            searchWrappersByOutputIngredient(
              recipes || RecipesEmpty,
              ingredients,
            ),
          [recipes],
        ),
        error,
      }}
      children={children}
    />
  )
}

async function getRecipesV2() {
  const response = await fetch(
    'https://graphcraft.cruftbusters.com/recipes-v2.json',
  )
  if (response.status < 200 || response.status > 299) {
    return [
      null,
      `got status ${response.statusText} while fetching /recipes-v2.json`,
    ]
  }
  return [await response.json(), '']
}

function uniqueCategories(recipes: Recipes) {
  return {
    ...recipes,
    categories: recipes.categories.filter(
      (category: any, i: number) =>
        recipes.categories
          .map((category: any) => category.title)
          .indexOf(category.title) === i,
    ),
  }
}

function getIngredients(recipes: Recipes) {
  const ingredients = new Map<string, Ingredient>()
  recipes.categories.forEach((category) => {
    category.wrappers
      .filter((recipe) => recipe !== null)
      .forEach((recipe) => {
        recipe.inputSlots
          .flat()
          .filter(
            (ingredient) =>
              ingredient !== null && ingredient.id !== undefined,
          )
          .forEach((ingredient) =>
            ingredients.set(ingredient.id, ingredient),
          )
        recipe.outputSlots
          .flat()
          .filter(
            (ingredient) =>
              ingredient !== null && ingredient.id !== undefined,
          )
          .forEach((ingredient) =>
            ingredients.set(ingredient.id, ingredient),
          )
      })
  })
  return ingredients
}

function searchWrappersByOutputIngredient(
  recipes: Recipes,
  ingredient: Ingredient,
) {
  return recipes.categories.reduce((results, category) => {
    const wrappers = category.wrappers.filter((wrapper) =>
      wrapperHasOutputIngredient(wrapper, ingredient),
    )
    if (wrappers.length > 0) {
      results.set(category.title, wrappers)
    }
    return results
  }, new Map<string, Wrapper[]>())
}

function wrapperHasOutputIngredient(
  wrapper: Wrapper,
  ingredient: Ingredient,
) {
  return wrapper.outputSlots
    .flat()
    .filter(
      (ingredient) =>
        ingredient !== null && ingredient.unlocalizedName !== undefined,
    )
    .some(
      (ingredientWithCount) =>
        ingredientWithCount.unlocalizedName === ingredient.unlocalizedName,
    )
}

export function useRecipes() {
  return useContext(recipeContext)
}
