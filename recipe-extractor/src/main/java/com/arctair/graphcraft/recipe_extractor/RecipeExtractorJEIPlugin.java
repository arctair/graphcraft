package com.arctair.graphcraft.recipe_extractor;

import com.google.gson.stream.JsonWriter;
import mezz.jei.api.IJeiRuntime;
import mezz.jei.api.IModPlugin;
import mezz.jei.api.JEIPlugin;
import mezz.jei.recipes.RecipeRegistry;
import net.minecraft.client.Minecraft;

import javax.annotation.ParametersAreNonnullByDefault;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.MessageFormat;

@JEIPlugin
@ParametersAreNonnullByDefault
public class RecipeExtractorJEIPlugin implements IModPlugin {
    private static final String resultPath = mcDataDir("/extractor-recipes.json");
    private static final String errorLogPath = mcDataDir("/extractor-recipes.error.log");

    public void onRuntimeAvailable(IJeiRuntime jeiRuntime) {
        try (
                FileWriter errorFileWriter = new FileWriter(errorLogPath);
                BufferedWriter bufferedErrorWriter = new BufferedWriter(errorFileWriter);
                PrintWriter errorWriter = new PrintWriter(bufferedErrorWriter);
        ) {
            try (
                    FileWriter fileWriter = new FileWriter(resultPath);
                    BufferedWriter bufferedWriter = new BufferedWriter(fileWriter);
                    JsonWriter writer = new JsonWriter(bufferedWriter);
            ) {
                RecipeRegistry registry = (RecipeRegistry) jeiRuntime.getRecipeRegistry();
                new RecipeExtractor(writer, registry).writeRegistry();
            } catch (IOException exception) {
                String message = MessageFormat.format("There was an error while writing recipe registry to {0}. See {1} for more details", resultPath, errorLogPath);
                RuntimeException wrapped = new RuntimeException(message, exception);
                wrapped.printStackTrace(errorWriter);
                throw wrapped;
            }
        } catch (IOException exception) {
            throw new RuntimeException(exception);
        }
    }

    private static String mcDataDir(String suffix) {
        return Minecraft.getMinecraft().mcDataDir + suffix;
    }
}
