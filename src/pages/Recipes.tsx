import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import greenJuice from "@/assets/recipes/green-juice.jpg";
import beetJuice from "@/assets/recipes/beet-juice.jpg";
import citrusJuice from "@/assets/recipes/citrus-juice.jpg";
import berryJuice from "@/assets/recipes/berry-juice.jpg";
import { supabase } from "@/supabase/client";

interface RecipeWithMatch {
  id: string;
  name: string;
  thumbnail: string;
  matchType: "perfect" | "missing-1" | "missing-2" | "missing-more";
  matchedIngredients: string[];
  missingIngredients: string[];
  description: string;
  score: number;
}

// Map recipe names to local images
const RECIPE_IMAGE_MAP: Record<string, string> = {
  "morning green boost": greenJuice,
  "green": greenJuice,
  "sweet beet energy": beetJuice,
  "beet": beetJuice,
  "citrus punch": citrusJuice,
  "citrus": citrusJuice,
  "immune booster": citrusJuice,
  "tropical paradise": citrusJuice,
  "berry glow up": berryJuice,
  "berry blast": berryJuice,
  "berry": berryJuice,
  "fresh zing cleanser": greenJuice,
};

const Recipes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<RecipeWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("best-match");
  const [perfectOnly, setPerfectOnly] = useState(false);
  
const selectedIngredients = useMemo(() => {
  return searchParams.get("ingredients")?.split(",").filter(Boolean) || [];
}, [searchParams]);

useEffect(() => {
  fetchRecipes();
}, [selectedIngredients.join(",")]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);

      // Fetch all recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*');

      if (recipesError) throw recipesError;

      if (!recipesData || recipesData.length === 0) {
        setRecipes([]);
        return;
      }

      // Fetch all recipe ingredients relationships
      const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe_id,
          ingredient_id,
          ingredients (
            id,
            name
          )
        `);

      if (recipeIngredientsError) throw recipeIngredientsError;

      // Group ingredients by recipe
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

      // Process recipes and calculate matches
      const processedRecipes: RecipeWithMatch[] = recipesData.map((recipe) => {
        const recipeIngredients = recipeIngredientsMap.get(recipe.id) || [];
        
        // Calculate matched and missing ingredients
        const matchedIngredients = recipeIngredients.filter(ing => 
          selectedIngredients.some(selected => 
            selected.toLowerCase() === ing.toLowerCase()
          )
        );

        const missingIngredients = recipeIngredients.filter(ing => 
          !selectedIngredients.some(selected => 
            selected.toLowerCase() === ing.toLowerCase()
          )
        );

        const matchCount = matchedIngredients.length;
        const totalIngredients = recipeIngredients.length;
        const missingCount = missingIngredients.length;

        // Determine match type
        let matchType: RecipeWithMatch["matchType"];
        if (missingCount === 0 && matchCount > 0) {
          matchType = "perfect";
        } else if (missingCount === 1) {
          matchType = "missing-1";
        } else if (missingCount === 2) {
          matchType = "missing-2";
        } else {
          matchType = "missing-more";
        }

        // Calculate score (higher is better)
        const matchPercentage = totalIngredients > 0 ? (matchCount / totalIngredients) * 100 : 0;
        const score = Math.round(matchPercentage);

        // Get thumbnail image
        const recipeNameLower = recipe.name.toLowerCase();
        let thumbnail = recipe.thumbnail_url || "";
        
        if (!thumbnail) {
          // Try to find matching local image
          for (const [key, image] of Object.entries(RECIPE_IMAGE_MAP)) {
            if (recipeNameLower.includes(key)) {
              thumbnail = image;
              break;
            }
          }
          // Default fallback
          if (!thumbnail) {
            thumbnail = greenJuice;
          }
        }

        return {
          id: recipe.id,
          name: recipe.name,
          thumbnail,
          matchType,
          matchedIngredients,
          missingIngredients,
          description: recipe.description || "",
          score,
        };
      });

      // Filter out recipes with no matches if user selected ingredients
      let filteredRecipes = processedRecipes;
      if (selectedIngredients.length > 0) {
        filteredRecipes = processedRecipes.filter(recipe => recipe.matchedIngredients.length > 0);
      }

      setRecipes(filteredRecipes);
    } catch (error: any) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load recipes. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  const filteredRecipes = recipes
    .filter(recipe => {
      if (perfectOnly) {
        return recipe.matchType === "perfect";
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "best-match") {
        // Sort by match type first (perfect > missing-1 > missing-2 > missing-more)
        const matchOrder = { perfect: 0, "missing-1": 1, "missing-2": 2, "missing-more": 3 };
        const matchComparison = matchOrder[a.matchType] - matchOrder[b.matchType];
        if (matchComparison !== 0) return matchComparison;
        // Then by score
        return b.score - a.score;
      }
      if (sortBy === "fewest-missing") {
        return a.missingIngredients.length - b.missingIngredients.length;
      }
      if (sortBy === "a-z") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const perfectMatches = filteredRecipes.filter(r => r.matchType === "perfect").length;

  const getMatchBadge = (matchType: RecipeWithMatch["matchType"]) => {
    if (matchType === "perfect") {
      return <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/90">✅ Perfect Match</Badge>;
    }
    if (matchType === "missing-1") {
      return <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">⚠️ Missing 1</Badge>;
    }
    if (matchType === "missing-2") {
      return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">⚠️ Missing 2</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">⚠️ Missing {matchType === "missing-more" ? "3+" : ""}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackButton onBackClick={() => navigate("/")} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton onBackClick={() => navigate("/")} />
      
      {/* Page Title Section */}
      {selectedIngredients.length > 0 && (
        <div className="container px-4 py-6 border-b">
          <h1 className="text-2xl font-bold mb-2">
            Recipes for Your Selection
          </h1>
          <p className="text-muted-foreground">
            Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} 
            {perfectMatches > 0 && ` (${perfectMatches} perfect match${perfectMatches !== 1 ? 'es' : ''})`}
          </p>
        </div>
      )}

      {/* Recipe Cards */}
      <main className="container px-4 py-8">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="text-6xl mb-4">🍊</div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-juice bg-clip-text text-transparent">
              {selectedIngredients.length === 0 ? "Select Ingredients" : "No matches found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {selectedIngredients.length === 0 
                ? "Choose ingredients from the homepage to discover delicious juice recipes!"
                : "Try selecting different ingredients to find recipes you can make!"
              }
            </p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {selectedIngredients.length === 0 ? "Select Ingredients" : "Back to Ingredients"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map(recipe => (
              <Card 
                key={recipe.id} 
                className={`group cursor-pointer transition-smooth hover:shadow-hover shadow-soft overflow-hidden ${
                  recipe.matchType === "perfect" ? "ring-2 ring-secondary/20" : ""
                }`} 
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    {/* Thumbnail */}
                    <div className="w-full overflow-hidden">
                      <img 
                        src={recipe.thumbnail} 
                        alt={recipe.name} 
                        className="w-full h-48 object-cover transition-smooth group-hover:scale-105" 
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-3">
                        {getMatchBadge(recipe.matchType)}
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-smooth">
                        {recipe.name}
                      </h3>

                      {/* Ingredient Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {recipe.matchedIngredients.map(ing => (
                          <span 
                            key={ing} 
                            className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary font-medium"
                          >
                            {ing}
                          </span>
                        ))}
                        {recipe.missingIngredients.map(ing => (
                          <span 
                            key={ing} 
                            className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>

                      <Button className="w-full transition-smooth" variant="default">
                        View Recipe
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Hint */}
        {filteredRecipes.length > 0 && (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="text-4xl mb-3">🍋</div>
            <p className="text-muted-foreground mb-4">
              Add more ingredients to discover even more delicious combinations!
            </p>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Add More Ingredients
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12 bg-muted/30">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Powered by what's already in your kitchen 🍊
          </p>
          <p className="text-xs text-muted-foreground">© 2025 JuiceMatch</p>
        </div>
      </footer>
    </div>
  );
};

export default Recipes;