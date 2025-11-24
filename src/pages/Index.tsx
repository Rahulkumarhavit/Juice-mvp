import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SelectedIngredientsBar from "@/components/SelectedIngredientsBar";
import IngredientsGrid, { Ingredient } from "@/components/IngredientsGrid";
import LiveFeedbackBar from "@/components/LiveFeedbackBar";
import { useToast } from "@/hooks/use-toast";

// Import local images as fallback
import appleImg from "@/assets/ingredients/apple.jpg";
import orangeImg from "@/assets/ingredients/orange.jpg";
import bananaImg from "@/assets/ingredients/banana.jpg";
import strawberryImg from "@/assets/ingredients/strawberry.jpg";
import pineappleImg from "@/assets/ingredients/pineapple.jpg";
import mangoImg from "@/assets/ingredients/mango.jpg";
import watermelonImg from "@/assets/ingredients/watermelon.jpg";
import grapesImg from "@/assets/ingredients/grapes.jpg";
import carrotImg from "@/assets/ingredients/carrot.jpg";
import spinachImg from "@/assets/ingredients/spinach.jpg";
import kaleImg from "@/assets/ingredients/kale.jpg";
import celeryImg from "@/assets/ingredients/celery.jpg";
import cucumberImg from "@/assets/ingredients/cucumber.jpg";
import beetImg from "@/assets/ingredients/beet.jpg";
import gingerImg from "@/assets/ingredients/ginger.jpg";
import lemonImg from "@/assets/ingredients/lemon.jpg";
import limeImg from "@/assets/ingredients/lime.jpg";
import blueberryImg from "@/assets/ingredients/blueberry.jpg";
import peachImg from "@/assets/ingredients/peach.jpg";
import pearImg from "@/assets/ingredients/pear.jpg";
import kiwiImg from "@/assets/ingredients/kiwi.jpg";
import coconutImg from "@/assets/ingredients/coconut.jpg";
import papayaImg from "@/assets/ingredients/papaya.jpg";
import cherryImg from "@/assets/ingredients/cherry.jpg";
import { supabase } from "@/supabase/client";

// Map ingredient names to local images
const IMAGE_MAP: Record<string, string> = {
  apple: appleImg,
  orange: orangeImg,
  banana: bananaImg,
  strawberry: strawberryImg,
  pineapple: pineappleImg,
  mango: mangoImg,
  watermelon: watermelonImg,
  grapes: grapesImg,
  carrot: carrotImg,
  spinach: spinachImg,
  kale: kaleImg,
  celery: celeryImg,
  cucumber: cucumberImg,
  beet: beetImg,
  ginger: gingerImg,
  lemon: lemonImg,
  lime: limeImg,
  blueberry: blueberryImg,
  peach: peachImg,
  pear: pearImg,
  kiwi: kiwiImg,
  coconut: coconutImg,
  papaya: papayaImg,
  cherry: cherryImg,
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [recipeCount, setRecipeCount] = useState(0);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Create category ID to name map
      const categoryMap: Record<string, string> = {};
      categoriesData?.forEach(cat => {
        categoryMap[cat.id] = cat.name;
      });
      setCategories(categoryMap);

      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (ingredientsError) throw ingredientsError;

      // Transform Supabase data to match Ingredient interface
      const transformedIngredients: Ingredient[] = ingredientsData?.map(item => {
        const imageName = item.name.toLowerCase().replace(/\s+/g, '');

        return {
          name: item.name,
          emoji: item.emoji || "🔸",
          // Use image_url from Supabase if available, otherwise use local image map
          image: item.image_url || IMAGE_MAP[imageName] || "",
          isPopular: item.is_popular || false,
          category: categoryMap[item.category_id] || "Other"
        };
      }) || [];

      setIngredients(transformedIngredients);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load ingredients. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const handleClearAll = () => {
    setSelectedIngredients([]);
  };

  useEffect(() => {
    const fetchRecipeCount = async () => {
      if (selectedIngredients.length === 0) {
        setRecipeCount(0);
        return;
      }

      try {
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('id');

        if (recipesError) throw recipesError;

        const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
          .from('recipe_ingredients')
          .select(`
          recipe_id,
          ingredient_id,
          ingredients (
            name
          )
        `);

        if (recipeIngredientsError) throw recipeIngredientsError;

        const recipeIngredientsMap = new Map<string, string[]>();
        recipeIngredientsData?.forEach((ri: any) => {
          const recipeId = ri.recipe_id;
          const ingredientName = ri.ingredients?.name;

          if (!recipeIngredientsMap.has(recipeId)) {
            recipeIngredientsMap.set(recipeId, []);
          }
          if (ingredientName) {
            recipeIngredientsMap.get(recipeId)?.push(ingredientName);
          }
        });

        let matchCount = 0;
        recipesData?.forEach((recipe) => {
          const recipeIngredients = recipeIngredientsMap.get(recipe.id) || [];
          const hasMatches = recipeIngredients.some(ing =>
            selectedIngredients.some(selected =>
              selected.toLowerCase() === ing.toLowerCase()
            )
          );
          if (hasMatches) matchCount++;
        });

        setRecipeCount(matchCount);
      } catch (error) {
        console.error("Error fetching recipe count:", error);
        setRecipeCount(0);
      }
    };

    fetchRecipeCount();
  }, [selectedIngredients]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading ingredients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header />
      <HeroSection />
      <SelectedIngredientsBar
        selectedIngredients={selectedIngredients}
        onRemove={handleRemoveIngredient}
        onClearAll={handleClearAll}
      />
      {ingredients.length === 0 ? (
        <div className="container px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🍊</div>
            <h2 className="text-2xl font-bold mb-3">No Ingredients Yet</h2>
            <p className="text-muted-foreground">
              Ingredients will appear here once they are added by an administrator.
            </p>
          </div>
        </div>
      ) : (
        <>
          <IngredientsGrid
            ingredients={ingredients}
            selectedIngredients={selectedIngredients}
            onToggle={handleToggleIngredient}
          />
          <div className="container px-4 py-8 text-center">
            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold text-lg transition-smooth shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedIngredients.length === 0}
              onClick={() => navigate(`/recipes?ingredients=${selectedIngredients.join(",")}`)}
            >
              See Recipes {selectedIngredients.length > 0 && `(${recipeCount})`}
            </button>
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-50">
        <div className="container px-4 py-4 flex items-center justify-between">

          {/* LEFT placeholder (keeps center text centered) */}
          <div className="w-1/3"></div>

          {/* CENTER message when no ingredients selected */}
          <div className="w-1/3 text-center">
            {selectedIngredients.length === 0 && (
              <div className="text-center">
                No ingredients selected yet. Start tapping to see what you can make!
              </div>
            )}
          </div>

          {/* RIGHT button */}
          <div className="w-1/3 flex justify-end">
            {selectedIngredients.length > 0 && (
              <button
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold text-lg transition-smooth shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedIngredients.length === 0}
                onClick={() =>
                  navigate(`/recipes?ingredients=${selectedIngredients.join(",")}`)
                }
              >
                See Recipes ({recipeCount})
              </button>
            )}
          </div>

        </div>
      </div>



    </div>
  );
};

export default Index;