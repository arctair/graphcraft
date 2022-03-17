import flask
from flask import Flask


def create_app():
    app = Flask(__name__)
    RecipesController().register(app)
    return app


class RecipesController:
    def __init__(self):
        self.recipes_v2 = None

    def register(self, app):
        app.route("/recipes-v1.json", methods=["PUT"])(self.put_recipes_v1)
        app.route("/recipes-v2.json", methods=["GET"])(self.get_recipes_v2)

    def put_recipes_v1(self):
        self.recipes_v2 = upgrade_recipes_v1(flask.request.json)
        return "", 204

    def get_recipes_v2(self):
        return self.recipes_v2


def upgrade_recipes_v1(recipes_v1):
    return {
        "categories": upgrade_recipes_v1_categories(recipes_v1["categories"])
    }


def upgrade_recipes_v1_categories(categories):
    return lm(
        lambda category: {
            "title": category["title"],
            "modName": category["modName"],
            "uid": category["uid"],
            "wrappers": upgrade_recipes_v1_recipes(category["recipes"]),
        },
        categories,
    )


def upgrade_recipes_v1_recipes(wrappers):
    return lm(
        lambda wrapper: {
            "type": wrapper["type"],
            "inputSlots": upgrade_recipes_v1_ingredients(wrapper["inputIngredients"]),
            "outputSlots": upgrade_recipes_v1_ingredients(wrapper["outputIngredients"]),
        },
        wrappers,
    )


def upgrade_recipes_v1_ingredients(ingredients):
    return lm(
        lambda slot: lm(
            lambda ingredient: upgrade_recipes_v1_ingredient(ingredient),
            slot,
        ),
        ingredients,
    )


def upgrade_recipes_v1_ingredient(ingredient):
    if ingredient is None:
        return None

    upgraded = {
        "id": get_ingredient_id(ingredient),
        "type": ingredient["type"],
    }

    if "amount" in upgraded:
        upgraded["amount"] = ingredient["amount"]
    if "count" in ingredient:
        upgraded["count"] = ingredient["count"]
    if "metadata" in ingredient:
        upgraded["metadata"] = ingredient["metadata"]

    if ingredient["type"] == "DyeIngredient":
        upgraded["dye"] = ingredient["dye"]
        return upgraded
    elif ingredient["type"] == "PotionIngredient":
        upgraded["potionType"] = ingredient["potionType"]
        return upgraded
    elif ingredient["type"] == "EnergyIngredient":
        upgraded["isPerTick"] = ingredient["isPerTick"]
        return upgraded

    upgraded["localizedName"] = ingredient["localizedName"]
    upgraded["unlocalizedName"] = ingredient["unlocalizedName"]
    return upgraded


def get_ingredient_id(ingredient):
    if ingredient["type"] == "DyeIngredient":
        return f'dye:{ingredient["dye"]}'
    elif ingredient["type"] == "PotionIngredient":
        return f'potion:{ingredient["potionType"]}'
    elif ingredient["type"] == "EnergyIngredient":
        return 'energy'
    suffix = f':{ingredient["metadata"]}' if "metadata" in ingredient else ""
    return ingredient["unlocalizedName"] + suffix


def lm(a, b):
    return list(map(a, b))
