package com.arctair.graphcraft.recipe_extractor;

import com.google.gson.stream.JsonWriter;
import mezz.jei.api.recipe.IRecipeCategory;
import mezz.jei.api.recipe.IRecipeWrapper;
import mezz.jei.ingredients.Ingredients;
import mezz.jei.plugins.vanilla.crafting.ShapedOreRecipeWrapper;
import mezz.jei.plugins.vanilla.crafting.ShapedRecipesWrapper;
import mezz.jei.recipes.RecipeRegistry;
import net.minecraft.item.ItemStack;
import net.minecraftforge.fluids.FluidStack;

import java.io.IOException;
import java.io.PrintWriter;
import java.text.MessageFormat;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.function.Supplier;

public class RecipeExtractor {
    private final JsonWriter writer;
    private final RecipeRegistry registry;

    public RecipeExtractor(JsonWriter writer, RecipeRegistry registry) {
        this.writer = writer;
        this.registry = registry;
    }

    public void writeRegistry() throws IOException {
        writer.beginObject();
        writer.name("categories").beginArray();
        for (IRecipeCategory<IRecipeWrapper> category : registry.getRecipeCategories()) {
            writeCategory(category);
        }
        writer.endArray();
        writer.endObject();
    }

    private void writeCategory(IRecipeCategory<IRecipeWrapper> category) throws IOException {
        writer.beginObject();
        writer.name("title").value(category.getTitle());
        writer.name("modName").value(category.getModName());
        writer.name("uid").value(category.getUid());
        writer.name("recipes").beginArray();
        for (IRecipeWrapper wrapper : registry.getRecipeWrappers(category)) {
            writeWrapper(wrapper);
        }
        writer.endArray();
        writer.endObject();
    }

    private void writeWrapper(IRecipeWrapper wrapper) throws IOException {
        writer.beginObject();

        writer.name("type").value(wrapper.getClass().getSimpleName());
        if (wrapper instanceof ShapedRecipesWrapper) {
            ShapedRecipesWrapper shapedRecipesWrapper = (ShapedRecipesWrapper) wrapper;
            writer.name("width").value(shapedRecipesWrapper.getWidth());
            writer.name("height").value(shapedRecipesWrapper.getHeight());
        } else if (wrapper instanceof ShapedOreRecipeWrapper) {
            ShapedOreRecipeWrapper shapedOreRecipeWrapper = (ShapedOreRecipeWrapper) wrapper;
            writer.name("width").value(shapedOreRecipeWrapper.getWidth());
            writer.name("height").value(shapedOreRecipeWrapper.getHeight());
        }

        Ingredients ingredients = registry.getIngredients(wrapper);
        writeIngredients("inputIngredients", ingredients.getInputIngredients().values());
        writeIngredients("outputIngredients", ingredients.getOutputIngredients().values());
        writer.endObject();
    }

    private void writeIngredients(String name, Collection<List> options) throws IOException {
        writer.name(name).beginArray();
        for (List option : options) {
            writer.beginArray();
            for (Object ingredient : option) {
                writeIngredient(ingredient);
            }
            writer.endArray();
        }
        writer.endArray();
    }

    private void writeIngredient(Object ingredient) throws IOException {
        if (ingredient == null) {
            writer.nullValue();
            return;
        }

        writer.beginObject();
        writer.name("type").value(ingredient.getClass().getSimpleName());
        if (ingredient instanceof ItemStack) {
            ItemStack itemStack = (ItemStack) ingredient;
            writer.name("localizedName").value(itemStack.getDisplayName());
            writer.name("unlocalizedName").value(itemStack.getUnlocalizedName());
            if (itemStack.getCount() != 1) {
                writer.name("count").value(itemStack.getCount());
            }
            if (itemStack.getMetadata() != 0) {
                writer.name("metadata").value(itemStack.getMetadata());
            }
        } else if (ingredient instanceof FluidStack) {
            FluidStack fluidStack = (FluidStack) ingredient;
            writer.name("localizedName").value(fluidStack.getLocalizedName());
            writer.name("unlocalizedName").value(fluidStack.getUnlocalizedName());
            writer.name("amount").value(fluidStack.amount);
        }
        writer.endObject();
    }
}
