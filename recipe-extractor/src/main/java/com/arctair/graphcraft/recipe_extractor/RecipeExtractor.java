package com.arctair.graphcraft.recipe_extractor;

import com.google.gson.stream.JsonWriter;
import crazypants.enderio.base.integration.jei.energy.EnergyIngredient;
import knightminer.inspirations.plugins.jei.cauldron.ingredient.DyeIngredient;
import knightminer.inspirations.plugins.jei.cauldron.ingredient.PotionIngredient;
import mezz.jei.api.recipe.IIngredientType;
import mezz.jei.api.recipe.IRecipeCategory;
import mezz.jei.api.recipe.IRecipeWrapper;
import mezz.jei.ingredients.Ingredients;
import mezz.jei.recipes.RecipeRegistry;
import net.minecraft.item.ItemStack;
import net.minecraftforge.fluids.FluidStack;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

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

        Ingredients ingredients = registry.getIngredients(wrapper);
        writeIngredients("inputIngredients", getSlots(ingredients.getInputIngredients(), ingredients::getInputs));
        writeIngredients("outputIngredients", getSlots(ingredients.getOutputIngredients(), ingredients::getOutputs));
        writer.endObject();
    }

    private List<List<Object>> getSlots(Map<IIngredientType, List> ingredientsByType, Function<IIngredientType, List<List<Object>>> getIngredientsByType) {
        List<List<Object>> slots = new ArrayList<>();
        for (IIngredientType type : ingredientsByType.keySet()) {
            slots.addAll(getIngredientsByType.apply(type));
        }
        return slots;
    }

    private void writeIngredients(String name, List<List<Object>> slots) throws IOException {
        writer.name(name).beginArray();
        for (List slot : slots) {
            writer.beginArray();
            for (Object ingredient : slot) {
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
            writer.name("displayName").value(itemStack.getDisplayName());
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
        } else if (ingredient instanceof DyeIngredient) {
            DyeIngredient dyeIngredient = (DyeIngredient) ingredient;
            writer.name("dye").value(String.valueOf(dyeIngredient.getDye()));
        } else if (ingredient instanceof PotionIngredient) {
            PotionIngredient potionIngredient = (PotionIngredient) ingredient;
            writer.name("potionType").value(String.valueOf(potionIngredient.getPotion()));
        } else if (ingredient instanceof EnergyIngredient) {
            EnergyIngredient energyIngredient = (EnergyIngredient) ingredient;
            if (energyIngredient.hasAmount()) {
                writer.name("amount").value(energyIngredient.getAmount());
            }
            writer.name("isPerTick").value(energyIngredient.isPerTick());
        } else {
            writer.name("canonicalName").value(ingredient.getClass().getCanonicalName());
        }
        writer.endObject();
    }
}
