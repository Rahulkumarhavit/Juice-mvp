// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Users, ChevronRight, Home } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import Header from "@/components/Header";
// import { useToast } from "@/hooks/use-toast";
// import greenJuice from "@/assets/recipes/green-juice.jpg";
// import beetJuice from "@/assets/recipes/beet-juice.jpg";
// import citrusJuice from "@/assets/recipes/citrus-juice.jpg";
// import berryJuice from "@/assets/recipes/berry-juice.jpg";

// // Import ingredient images for mapping
// import appleImg from "@/assets/ingredients/apple.jpg";
// import celeryImg from "@/assets/ingredients/celery.jpg";
// import orangeImg from "@/assets/ingredients/orange.jpg";
// import spinachImg from "@/assets/ingredients/spinach.jpg";
// import lemonImg from "@/assets/ingredients/lemon.jpg";
// import gingerImg from "@/assets/ingredients/ginger.jpg";
// import bananaImg from "@/assets/ingredients/banana.jpg";
// import strawberryImg from "@/assets/ingredients/strawberry.jpg";
// import pineappleImg from "@/assets/ingredients/pineapple.jpg";
// import mangoImg from "@/assets/ingredients/mango.jpg";
// import watermelonImg from "@/assets/ingredients/watermelon.jpg";
// import grapesImg from "@/assets/ingredients/grapes.jpg";
// import carrotImg from "@/assets/ingredients/carrot.jpg";
// import kaleImg from "@/assets/ingredients/kale.jpg";
// import cucumberImg from "@/assets/ingredients/cucumber.jpg";
// import beetImg from "@/assets/ingredients/beet.jpg";
// import limeImg from "@/assets/ingredients/lime.jpg";
// import blueberryImg from "@/assets/ingredients/blueberry.jpg";
// import peachImg from "@/assets/ingredients/peach.jpg";
// import pearImg from "@/assets/ingredients/pear.jpg";
// import kiwiImg from "@/assets/ingredients/kiwi.jpg";
// import coconutImg from "@/assets/ingredients/coconut.jpg";
// import papayaImg from "@/assets/ingredients/papaya.jpg";
// import cherryImg from "@/assets/ingredients/cherry.jpg";
// import { supabase } from "@/supabase/client";

// interface IngredientDetail {
//   name: string;
//   emoji: string;
//   image: string;
// }

// interface RecipeData {
//   id: string;
//   name: string;
//   description: string;
//   image: string;
//   yield_oz: string;
//   ingredients: IngredientDetail[];
// }

// // Map ingredient names to local images
// const INGREDIENT_IMAGE_MAP: Record<string, string> = {
//   apple: appleImg,
//   orange: orangeImg,
//   banana: bananaImg,
//   strawberry: strawberryImg,
//   pineapple: pineappleImg,
//   mango: mangoImg,
//   watermelon: watermelonImg,
//   grapes: grapesImg,
//   carrot: carrotImg,
//   spinach: spinachImg,
//   kale: kaleImg,
//   celery: celeryImg,
//   cucumber: cucumberImg,
//   beet: beetImg,
//   ginger: gingerImg,
//   lemon: lemonImg,
//   lime: limeImg,
//   blueberry: blueberryImg,
//   peach: peachImg,
//   pear: pearImg,
//   kiwi: kiwiImg,
//   coconut: coconutImg,
//   papaya: papayaImg,
//   cherry: cherryImg,
// };

// const RECIPE_IMAGE_MAP: Record<string, string> = {
//   "morning green boost": greenJuice,
//   "green": greenJuice,
//   "sweet beet energy": beetJuice,
//   "beet": beetJuice,
//   "citrus punch": citrusJuice,
//   "citrus": citrusJuice,
//   "immune booster": citrusJuice,
//   "tropical paradise": citrusJuice,
//   "berry glow up": berryJuice,
//   "berry blast": berryJuice,
//   "berry": berryJuice,
//   "fresh zing cleanser": greenJuice,
// };

// const RecipeDetail = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const { id } = useParams();
//   const [recipe, setRecipe] = useState<RecipeData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (id) {
//       fetchRecipeDetail();
//     }
//   }, [id]);

//   const fetchRecipeDetail = async () => {
//     try {
//       setLoading(true);

//       // Fetch recipe
//       const { data: recipeData, error: recipeError } = await supabase
//         .from('recipes')
//         .select('*')
//         .eq('id', id)
//         .single();

//       if (recipeError) throw recipeError;

//       if (!recipeData) {
//         navigate('/recipes');
//         return;
//       }

//       // Fetch recipe ingredients
//       const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
//         .from('recipe_ingredients')
//         .select(`
//           ingredients (
//             id,
//             name,
//             emoji
//           )
//         `)
//         .eq('recipe_id', id);

//       if (recipeIngredientsError) throw recipeIngredientsError;

//       // Process ingredients
//       const ingredients: IngredientDetail[] = recipeIngredientsData?.map((ri: any) => {
//         const ingredientName = ri.ingredients?.name || '';
//         const ingredientNameLower = ingredientName.toLowerCase().replace(/\s+/g, '');

//         return {
//           name: ingredientName,
//           emoji: ri.ingredients?.emoji || '🔸',
//           image: INGREDIENT_IMAGE_MAP[ingredientNameLower] || '',
//         };
//       }) || [];

//       // Get recipe image
//       const recipeNameLower = recipeData.name.toLowerCase();
//       let recipeImage = recipeData.thumbnail_url || '';

//       if (!recipeImage) {
//         for (const [key, image] of Object.entries(RECIPE_IMAGE_MAP)) {
//           if (recipeNameLower.includes(key)) {
//             recipeImage = image;
//             break;
//           }
//         }
//         if (!recipeImage) {
//           recipeImage = greenJuice;
//         }
//       }

//       setRecipe({
//         id: recipeData.id,
//         name: recipeData.name,
//         description: recipeData.description || '',
//         image: recipeImage,
//         yield_oz: recipeData.yield_oz || '',
//         ingredients,
//       });

//     } catch (error: any) {
//       console.error("Error fetching recipe:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load recipe details.",
//         variant: "destructive",
//       });
//       navigate('/recipes');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Header showBackButton onBackClick={() => navigate(-1)} />
//         <div className="flex items-center justify-center py-20">
//           <div className="text-center">
//             <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//             <p className="mt-4 text-muted-foreground">Loading recipe...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!recipe) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <Header showBackButton onBackClick={() => navigate(-1)} />

//       {/* Hero Section */}
//       <div className="container px-4 py-8 md:py-12">
//         <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
//           {/* Left side - Image */}
//           <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden">
//             <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
//           </div>

//           {/* Right side - Content */}
//           <div className="flex flex-col justify-center space-y-4">
//             <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
//               {recipe.name}
//             </h1>
//             <p className="text-base md:text-lg text-muted-foreground">
//               {recipe.description}
//             </p>
//             <div className="flex flex-col gap-4 pt-2">
//               <div className="flex items-center gap-2">
//                 <Users className="w-5 h-5 text-primary" />
//                 <span className="font-semibold">{recipe.ingredients.length} Ingredients</span>
//               </div>

//               {recipe.yield_oz && (
//                 <div className="flex items-center gap-2">
//                   <Users className="w-5 h-5 text-primary" />
//                   <span className="font-semibold">{recipe.yield_oz} oz</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <main className="container px-4 py-12 max-w-5xl">
//         {/* Ingredients */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-6 text-primary">
//             Ingredients
//           </h2>
//           <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
//             {recipe.ingredients.map((ingredient, index) => (
//               <Card key={index} className="overflow-hidden hover:shadow-hover transition-smooth">
//                 <CardContent className="p-4">
//                   <div className="flex flex-col items-center text-center gap-3">
//                     {ingredient.image ? (
//                       <div className="w-20 h-20 rounded-lg overflow-hidden">
//                         <img
//                           src={ingredient.image}
//                           alt={ingredient.name}
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                     ) : (
//                       <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-4xl">
//                         {ingredient.emoji}
//                       </div>
//                     )}
//                     <div>
//                       <h3 className="font-bold text-sm">{ingredient.name}</h3>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </section>

//         {/* Directions */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-6 text-primary">
//             Directions
//           </h2>
//           <Card>
//             <CardContent className="pt-6">
//               <ol className="space-y-6">
//                 <li className="flex gap-4">
//                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
//                     1
//                   </div>
//                   <p className="flex-1 pt-0.5 text-foreground leading-relaxed">
//                     Wash all ingredients thoroughly.
//                   </p>
//                 </li>
//                 <li className="flex gap-4">
//                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
//                     2
//                   </div>
//                   <p className="flex-1 pt-0.5 text-foreground leading-relaxed">
//                     Process all ingredients in a juicer in the order listed above.
//                   </p>
//                 </li>
//                 <li className="flex gap-4">
//                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
//                     3
//                   </div>
//                   <p className="flex-1 pt-0.5 text-foreground leading-relaxed">
//                     Stir well and serve fresh for maximum nutrient retention.
//                   </p>
//                 </li>
//               </ol>
//             </CardContent>
//           </Card>
//         </section>

//         {/* Action Buttons */}
//         <div className="flex flex-col sm:flex-row gap-4">
//           <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate("/recipes")}>
//             Browse More Recipes
//           </Button>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="border-t py-8 mt-12 bg-muted/30">
//         <div className="container px-4 text-center">
//           <p className="text-sm text-muted-foreground mb-1">
//             Powered by what's already in your kitchen 🍊
//           </p>
//           <p className="text-xs text-muted-foreground">© 2025 JuiceMatch</p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default RecipeDetail;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import greenJuice from "@/assets/recipes/green-juice.jpg";
import beetJuice from "@/assets/recipes/beet-juice.jpg";
import citrusJuice from "@/assets/recipes/citrus-juice.jpg";
import berryJuice from "@/assets/recipes/berry-juice.jpg";

// Import ingredient images for mapping
import appleImg from "@/assets/ingredients/apple.jpg";
import celeryImg from "@/assets/ingredients/celery.jpg";
import orangeImg from "@/assets/ingredients/orange.jpg";
import spinachImg from "@/assets/ingredients/spinach.jpg";
import lemonImg from "@/assets/ingredients/lemon.jpg";
import gingerImg from "@/assets/ingredients/ginger.jpg";
import bananaImg from "@/assets/ingredients/banana.jpg";
import strawberryImg from "@/assets/ingredients/strawberry.jpg";
import pineappleImg from "@/assets/ingredients/pineapple.jpg";
import mangoImg from "@/assets/ingredients/mango.jpg";
import watermelonImg from "@/assets/ingredients/watermelon.jpg";
import grapesImg from "@/assets/ingredients/grapes.jpg";
import carrotImg from "@/assets/ingredients/carrot.jpg";
import kaleImg from "@/assets/ingredients/kale.jpg";
import cucumberImg from "@/assets/ingredients/cucumber.jpg";
import beetImg from "@/assets/ingredients/beet.jpg";
import limeImg from "@/assets/ingredients/lime.jpg";
import blueberryImg from "@/assets/ingredients/blueberry.jpg";
import peachImg from "@/assets/ingredients/peach.jpg";
import pearImg from "@/assets/ingredients/pear.jpg";
import kiwiImg from "@/assets/ingredients/kiwi.jpg";
import coconutImg from "@/assets/ingredients/coconut.jpg";
import papayaImg from "@/assets/ingredients/papaya.jpg";
import cherryImg from "@/assets/ingredients/cherry.jpg";
import { supabase } from "@/supabase/client";

interface IngredientDetail {
  name: string;
  emoji: string;
  image: string;
  quantity?: string;
}

interface RecipeData {
  id: string;
  name: string;
  description: string;
  image: string;
  yield_oz: string;
  ingredients: IngredientDetail[];
  directions: string | null;
  quantity: string;
}

// Map ingredient names to local images
const INGREDIENT_IMAGE_MAP: Record<string, string> = {
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

// Default generic directions
const DEFAULT_DIRECTIONS = [
  "Wash all ingredients thoroughly.",
  "Process all ingredients in a juicer in the order listed above.",
  "Stir well and serve fresh for maximum nutrient retention."
];

/**
 * Parse directions string by splitting on periods/full stops
 * Returns an array of direction steps
 */
const parseDirections = (directionsString: string | null): string[] => {
  if (!directionsString || directionsString.trim() === '') {
    return DEFAULT_DIRECTIONS;
  }

  // Split by period, exclamation, or question mark followed by space or end of string
  const steps = directionsString
    .split(/[.!?]+/)
    .map(step => step.trim())
    .filter(step => step.length > 0);

  // If we couldn't parse any steps, return default
  if (steps.length === 0) {
    return DEFAULT_DIRECTIONS;
  }

  return steps;
};

const RecipeDetail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecipeDetail();
    }
  }, [id]);

  const fetchRecipeDetail = async () => {
    try {
      setLoading(true);

      // Fetch recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeError) throw recipeError;

      if (!recipeData) {
        navigate('/recipes');
        return;
      }

      // Fetch recipe ingredients
      const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          quantity,
          ingredients (
            id,
            name,
            emoji
          )
        `)
        .eq('recipe_id', id);

      if (recipeIngredientsError) throw recipeIngredientsError;

      // Process ingredients
      const ingredients: IngredientDetail[] = recipeIngredientsData?.map((ri: any) => {
        const ingredientName = ri.ingredients?.name || '';
        const ingredientNameLower = ingredientName.toLowerCase().replace(/\s+/g, '');

        return {
          name: ingredientName,
          emoji: ri.ingredients?.emoji || '🔸',
          image: INGREDIENT_IMAGE_MAP[ingredientNameLower] || '',
          quantity: ri.quantity || '',
        };
      }) || [];
      // Get recipe image
      const recipeNameLower = recipeData.name.toLowerCase();
      let recipeImage = recipeData.thumbnail_url || '';

      if (!recipeImage) {
        for (const [key, image] of Object.entries(RECIPE_IMAGE_MAP)) {
          if (recipeNameLower.includes(key)) {
            recipeImage = image;
            break;
          }
        }
        if (!recipeImage) {
          recipeImage = greenJuice;
        }
      }

      setRecipe({
        id: recipeData.id,
        name: recipeData.name,
        description: recipeData.description || '',
        image: recipeImage,
        yield_oz: recipeData.yield_oz || '',
        ingredients,
        directions: recipeData.directions || null,
        quantity: recipeData.quantity || '',
      });

    } catch (error: any) {
      console.error("Error fetching recipe:", error);
      toast({
        title: "Error",
        description: "Failed to load recipe details.",
        variant: "destructive",
      });
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackButton onBackClick={() => navigate(-1)} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  // Parse directions from the recipe or use defaults
  const directionSteps = parseDirections(recipe.directions);

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton onBackClick={() => navigate(-1)} />

      {/* Hero Section */}
      <div className="container px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
          {/* Left side - Image */}
          <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden">
            <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          </div>

          {/* Right side - Content */}
          <div className="flex flex-col justify-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {recipe.name}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              {recipe.description}
            </p>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Ingredients : {recipe.ingredients.length} </span>
              </div>

              {recipe.yield_oz && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">yield : {recipe.yield_oz} </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 py-12 max-w-5xl">
        {/* Ingredients */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">
            Ingredients
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {recipe.ingredients.map((ingredient, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-hover transition-smooth">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden">
                      <img
                        src={ingredient.emoji}
                        alt={ingredient.name}
                        className="w-full h-full object-cover"
                      />


                    </div>
                    <p>{ingredient.quantity}</p>
                    <div>
                      <h3 className="font-bold text-sm">{ingredient.name}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Directions */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">
            Directions
          </h2>
          <Card>
            <CardContent className="pt-6">
              <ol className="space-y-6">
                {directionSteps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="flex-1 pt-0.5 text-foreground leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate("/recipes")}>
            Browse More Recipes
          </Button>
        </div>
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

export default RecipeDetail;