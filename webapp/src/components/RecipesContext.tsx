import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export interface Ingredient {
  type: string
  displayName: string
  unlocalizedName: string
}

interface IngredientWithCount {
  type: string
  displayName: string
  unlocalizedName: string
  count: number
}

export interface Wrapper {
  type: string
  inputIngredients: Array<Array<IngredientWithCount>>
  outputIngredients: Array<Array<IngredientWithCount>>
}

interface Category {
  title: string
  recipes: Array<Wrapper>
}

export interface Recipes {
  categories: Array<Category>
}

interface RecipeContextValue {
  recipes?: Recipes
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
    [Recipes | undefined, Array<Ingredient>]
  >([undefined, []])
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
        const ingredients = new Map<string, Ingredient>()
        const recipes = uniqueCategories(await response.json())
        recipes.categories.forEach((category) => {
          category.recipes
            .filter((recipe) => recipe !== null)
            .forEach((recipe) => {
              recipe.inputIngredients
                .flat()
                .filter(
                  (ingredient) =>
                    ingredient !== null &&
                    ingredient.unlocalizedName !== undefined,
                )
                .map(
                  (ingredient) =>
                    ({
                      type: ingredient.type,
                      displayName: ingredient.displayName,
                      unlocalizedName: ingredient.unlocalizedName,
                    } as Ingredient),
                )
                .forEach((ingredient) =>
                  ingredients.set(ingredient.unlocalizedName, ingredient),
                )
              recipe.outputIngredients
                .flat()
                .filter(
                  (ingredient) =>
                    ingredient !== null &&
                    ingredient.unlocalizedName !== undefined,
                )
                .map(
                  (ingredient) =>
                    ({
                      type: ingredient.type,
                      displayName: ingredient.displayName,
                      unlocalizedName: ingredient.unlocalizedName,
                    } as Ingredient),
                )
                .forEach((ingredient) =>
                  ingredients.set(ingredient.unlocalizedName, ingredient),
                )
            })
        })

        setRecipesAndIngredients([
          recipes,
          Array.from(ingredients.values()),
        ])
      }
    })()
  }, [])
  return (
    <recipeContext.Provider
      value={{
        recipes,
        ingredients,
        searchWrappersByOutputIngredient: useCallback(
          (ingredient) => {
            const wrappersByCategory = new Map<string, Wrapper[]>()
            recipes?.categories.forEach((category) => {
              const wrappers: Wrapper[] = []
              category.recipes.forEach((wrapper) => {
                if (
                  wrapper.outputIngredients
                    .flat()
                    .filter(
                      (ingredient) =>
                        ingredient !== null &&
                        ingredient.unlocalizedName !== undefined,
                    )
                    .some(
                      (ingredientWithCount) =>
                        ingredientWithCount.unlocalizedName ===
                        ingredient.unlocalizedName,
                    )
                ) {
                  wrappers.push(wrapper)
                }
              })
              if (wrappers.length > 0) {
                wrappersByCategory.set(category.title, wrappers)
              }
            })
            return wrappersByCategory
          },
          [recipes],
        ),
        error,
      }}
      children={children}
    />
  )
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

export function useRecipes() {
  return useContext(recipeContext)
}
