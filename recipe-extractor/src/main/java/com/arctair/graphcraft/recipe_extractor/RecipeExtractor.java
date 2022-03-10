package com.arctair.graphcraft.recipe_extractor;

import mezz.jei.api.IJeiRuntime;
import mezz.jei.api.IModPlugin;
import mezz.jei.api.JEIPlugin;
import mezz.jei.api.ingredients.VanillaTypes;
import mezz.jei.api.recipe.IIngredientType;
import mezz.jei.api.recipe.IRecipeCategory;
import mezz.jei.api.recipe.IRecipeWrapper;
import mezz.jei.ingredients.Ingredients;
import mezz.jei.plugins.vanilla.crafting.ShapedOreRecipeWrapper;
import mezz.jei.plugins.vanilla.crafting.ShapedRecipesWrapper;
import mezz.jei.recipes.RecipeRegistry;
import net.minecraft.client.Minecraft;
import net.minecraft.item.ItemStack;

import javax.annotation.ParametersAreNonnullByDefault;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.text.MessageFormat;
import java.util.List;

@JEIPlugin
@ParametersAreNonnullByDefault
public class RecipeExtractor implements IModPlugin {
    public void onRuntimeAvailable(IJeiRuntime jeiRuntime) {
        try (
                FileWriter fileWriter = new FileWriter(Minecraft.getMinecraft().mcDataDir + "/recipe-extractor.log");
                BufferedWriter writer = new BufferedWriter(fileWriter)
        ) {
            RecipeRegistry registry = (RecipeRegistry) jeiRuntime.getRecipeRegistry();
            for (IRecipeCategory<IRecipeWrapper> category : registry.getRecipeCategories()) {
                writer.write(category.getTitle() + "\n");
                for (IRecipeWrapper wrapper : registry.getRecipeWrappers(category)) {
                    Ingredients ingredients = registry.getIngredients(wrapper);

                    writer.write(wrapperAsString(wrapper));
                    writer.write("  input ingredients:\n");
                    for (IIngredientType type : ingredients.getInputIngredients().keySet()) {
                        writeIngredients(writer, ingredients.getInputs(type));
                    }

                    writer.write("  output ingredients:\n");
                    writeIngredients(writer, ingredients.getOutputs(VanillaTypes.ITEM));
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static String wrapperAsString(IRecipeWrapper wrapper) {
        if (wrapper instanceof ShapedRecipesWrapper) {
            ShapedRecipesWrapper shapedRecipesWrapper = (ShapedRecipesWrapper) wrapper;
            return MessageFormat.format(
                    " {0}: ({1}x{2}):\n",
                    shapedRecipesWrapper.getClass(),
                    shapedRecipesWrapper.getWidth(),
                    shapedRecipesWrapper.getHeight()
            );
        } else if (wrapper instanceof ShapedOreRecipeWrapper) {
            ShapedOreRecipeWrapper shapedOreRecipeWrapper = (ShapedOreRecipeWrapper) wrapper;
            return MessageFormat.format(
                    " {0}: ({1}x{2}):\n",
                    shapedOreRecipeWrapper.getClass(),
                    shapedOreRecipeWrapper.getWidth(),
                    shapedOreRecipeWrapper.getHeight()
            );
        } else {
            return MessageFormat.format(" {0}:\n", wrapper.getClass());
        }
    }

    private static void writeIngredients(Writer writer, List options) throws IOException {
        for (List option : (List<List>) options) {
            writer.write("   slot:\n");
            for (Object ingredient : option) {
                writeIngredient(writer, ingredient);
            }
        }
    }

    private static void writeIngredient(Writer writer, Object ingredient) throws IOException {
        if (ingredient instanceof ItemStack) {
            ItemStack itemStack = (ItemStack) ingredient;
            writer.write(
                    MessageFormat.format(
                            "    {0,number,#} * {1} ({2}:{3,number,#}):\n",
                            itemStack.getCount(),
                            itemStack.getDisplayName(),
                            itemStack.getUnlocalizedName(),
                            itemStack.getMetadata()
                    )
            );
        } else {
            writer.write("    " + ingredient + " (" + ingredient.getClass().getSimpleName() + "):\n");
        }
    }
}
