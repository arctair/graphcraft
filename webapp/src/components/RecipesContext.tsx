import {
  createContext,
  ReactNode,
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

export type WrappersByCategoryTitle = Map<string, Wrapper[]>

export type WrappersByCategoryTitleByID = Map<
  string,
  WrappersByCategoryTitle
>

interface RecipeContextValue {
  ingredients: Array<Ingredient>
  wrappersByCategoryTitleByID: WrappersByCategoryTitleByID
  error: string
}
const recipeContext = createContext<RecipeContextValue>({
  ingredients: [],
  wrappersByCategoryTitleByID: new Map(),
  error: '',
})

interface RecipesProviderProps {
  children: ReactNode
}
export function RecipesProvider({ children }: RecipesProviderProps) {
  const [
    [wrappersByCategoryTitleByID, ingredients],
    setWrappersByCategoryTitleByIDAndIngredients,
  ] = useState<[WrappersByCategoryTitleByID, Array<Ingredient>]>([
    new Map(),
    [],
  ])
  const [error, setError] = useState('')
  useEffect(() => {
    ;(async function () {
      const [recipes, error] = await getRecipesV2()
      if (error) {
        setError(error)
        return
      }
      const ingredients = getIngredients(recipes)
      const wrappersByCategoryTitleByID = getWrappersByCategoryTitleByID(
        recipes,
      )

      setWrappersByCategoryTitleByIDAndIngredients([
        wrappersByCategoryTitleByID,
        Array.from(ingredients.values()),
      ])
    })()
  }, [])
  return (
    <recipeContext.Provider
      value={{
        ingredients,
        wrappersByCategoryTitleByID,
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
  console.log('ingredients size', ingredients.size)
  return ingredients
}

function getWrappersByCategoryTitleByID(recipes: Recipes) {
  const wrappersByCategoryTitleByID = new Map() as WrappersByCategoryTitleByID
  recipes.categories.forEach((category) => {
    category.wrappers.forEach((wrapper) => {
      wrapper.outputSlots.forEach((slot) => {
        slot.forEach((ingredient) => {
          const wrappersByCategoryTitle =
            wrappersByCategoryTitleByID.get(ingredient.id) ||
            (new Map() as WrappersByCategoryTitle)
          const wrappersMatchingCategoryTitle =
            wrappersByCategoryTitle.get(category.title) ||
            new Array<Wrapper>()
          wrappersMatchingCategoryTitle.push(wrapper)
          wrappersByCategoryTitle.set(
            category.title,
            wrappersMatchingCategoryTitle,
          )
          wrappersByCategoryTitleByID.set(
            ingredient.id,
            wrappersByCategoryTitle,
          )
        })
      })
    })
  })
  console.log(
    'wrappersByCategoryTitleByID size',
    wrappersByCategoryTitleByID.size,
  )
  return wrappersByCategoryTitleByID
}

export function useRecipes() {
  return useContext(recipeContext)
}
