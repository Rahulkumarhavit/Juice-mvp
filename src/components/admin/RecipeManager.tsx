import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";
import { supabase } from "@/supabase/client";

interface RecipeIngredient {
  name: string;
  quantity: string;
  ingredientId?: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  yield: number;
  ingredients: RecipeIngredient[];
  directions: string;
  thumbnailUrl: string;
}

interface AvailableIngredient {
  id: string;
  name: string;
}

const RecipeManager = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    yield: "",
    directions: "",
    thumbnailUrl: ""
  });
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ name: "", quantity: "" }]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available ingredients for dropdown
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name')
        .order('name');

      if (ingredientsError) throw ingredientsError;
      setAvailableIngredients(ingredientsData || []);

      // Fetch recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (recipesError) throw recipesError;

      // Fetch recipe ingredients
      const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe_id,
          quantity,
          ingredient_id,
          ingredients (
            id,
            name
          )
        `);

      if (recipeIngredientsError) throw recipeIngredientsError;

      // Group ingredients by recipe
      const recipeIngredientsMap = new Map<string, RecipeIngredient[]>();
      recipeIngredientsData?.forEach((ri: any) => {
        const recipeId = ri.recipe_id;
        if (!recipeIngredientsMap.has(recipeId)) {
          recipeIngredientsMap.set(recipeId, []);
        }
        recipeIngredientsMap.get(recipeId)?.push({
          name: ri.ingredients?.name || '',
          quantity: ri.quantity || '',
          ingredientId: ri.ingredient_id
        });
      });

      // Transform recipes
      const transformedRecipes: Recipe[] = recipesData?.map(recipe => ({
        id: recipe.id,
        title: recipe.name,
        description: recipe.description || '',
        yield: recipe.yield_oz || 0,
        ingredients: recipeIngredientsMap.get(recipe.id) || [],
        directions: recipe.directions || '',
        thumbnailUrl: recipe.thumbnail_url || ''
      })) || [];

      setRecipes(transformedRecipes);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load recipes. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, thumbnailUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredientRow = () => {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  };

  const removeIngredientRow = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleAdd = async () => {
    const validIngredients = ingredients.filter(ing => ing.name.trim());
    
    if (!formData.title.trim() || validIngredients.length === 0 || !formData.yield) {
      toast({
        title: "Error",
        description: "Title, at least one ingredient, and yield are required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert recipe
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name: formData.title,
          description: formData.description,
          yield_oz: parseInt(formData.yield),
          directions: formData.directions,
          thumbnail_url: formData.thumbnailUrl || null
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Insert recipe ingredients
      const recipeIngredientsToInsert = [];
      for (const ing of validIngredients) {
        // Find ingredient ID by name
        const ingredient = availableIngredients.find(
          ai => ai.name.toLowerCase() === ing.name.toLowerCase()
        );
        
        if (ingredient) {
          recipeIngredientsToInsert.push({
            recipe_id: newRecipe.id,
            ingredient_id: ingredient.id,
            quantity: ing.quantity || null
          });
        } else {
          console.warn(`Ingredient not found: ${ing.name}`);
        }
      }

      if (recipeIngredientsToInsert.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredientsToInsert);

        if (ingredientsError) throw ingredientsError;
      }

      await fetchData();
      resetForm();
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Recipe added successfully"
      });
    } catch (error: any) {
      console.error("Error adding recipe:", error);
      toast({
        title: "Error",
        description: "Failed to add recipe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      description: recipe.description,
      yield: recipe.yield.toString(),
      directions: recipe.directions,
      thumbnailUrl: recipe.thumbnailUrl
    });
    setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: "", quantity: "" }]);
  };

  const handleUpdate = async () => {
    if (!editingRecipe) return;
    
    const validIngredients = ingredients.filter(ing => ing.name.trim());
    
    if (validIngredients.length === 0) {
      toast({
        title: "Error",
        description: "At least one ingredient is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: formData.title,
          description: formData.description,
          yield_oz: parseInt(formData.yield),
          directions: formData.directions,
          thumbnail_url: formData.thumbnailUrl || null
        })
        .eq('id', editingRecipe.id);

      if (recipeError) throw recipeError;

      // Delete existing recipe ingredients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', editingRecipe.id);

      if (deleteError) throw deleteError;

      // Insert new recipe ingredients
      const recipeIngredientsToInsert = [];
      for (const ing of validIngredients) {
        const ingredient = availableIngredients.find(
          ai => ai.name.toLowerCase() === ing.name.toLowerCase()
        );
        
        if (ingredient) {
          recipeIngredientsToInsert.push({
            recipe_id: editingRecipe.id,
            ingredient_id: ingredient.id,
            quantity: ing.quantity || null
          });
        }
      }

      if (recipeIngredientsToInsert.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredientsToInsert);

        if (ingredientsError) throw ingredientsError;
      }

      await fetchData();
      setEditingRecipe(null);
      resetForm();
      toast({
        title: "Success",
        description: "Recipe updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete recipe ingredients first (foreign key constraint)
      const { error: deleteIngredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteIngredientsError) throw deleteIngredientsError;

      // Delete recipe
      const { error: deleteRecipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (deleteRecipeError) throw deleteRecipeError;

      await fetchData();
      toast({
        title: "Success",
        description: "Recipe deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting recipe:", error);
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      yield: "",
      directions: "",
      thumbnailUrl: ""
    });
    setIngredients([{ name: "", quantity: "" }]);
  };

  const RecipeForm = () => (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Recipe Title *</Label>
        <Input 
          id="title" 
          placeholder="e.g., Morning Green Boost" 
          value={formData.title} 
          onChange={e => setFormData({ ...formData, title: e.target.value })} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Brief description of the recipe" 
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })} 
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yield">Yield (oz) *</Label>
          <Input 
            id="yield" 
            type="number" 
            placeholder="16" 
            value={formData.yield} 
            onChange={e => setFormData({ ...formData, yield: e.target.value })} 
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Required Ingredients *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addIngredientRow}>
            <Plus className="w-4 h-4 mr-1" />
            Add Ingredient
          </Button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select ingredient...</option>
                {availableIngredients.map(ing => (
                  <option key={ing.id} value={ing.name}>{ing.name}</option>
                ))}
              </select>
              <Input
                placeholder="Quantity (e.g., 2 cups)"
                value={ingredient.quantity}
                onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                className="w-48"
              />
              {ingredients.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredientRow(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="directions">Directions</Label>
        <Textarea 
          id="directions" 
          placeholder="Step-by-step instructions..." 
          rows={5} 
          value={formData.directions} 
          onChange={e => setFormData({ ...formData, directions: e.target.value })} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail Image URL</Label>
        <div className="flex gap-2">
          <Input 
            id="thumbnail" 
            placeholder="https://example.com/image.jpg" 
            value={formData.thumbnailUrl} 
            onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} 
            className="flex-1" 
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{recipes.length} recipe(s) available</p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Recipe</DialogTitle>
              <DialogDescription>Create a new juice recipe with full details.</DialogDescription>
            </DialogHeader>
            <RecipeForm />
            <Button onClick={handleAdd} className="w-full">
              Add Recipe
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Yield</TableHead>
              <TableHead>Ingredients</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No recipes yet. Add your first recipe to get started!
                </TableCell>
              </TableRow>
            ) : (
              recipes.map(recipe => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.title}</TableCell>
                  <TableCell>{recipe.yield} oz</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 2).map((ing, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                          {ing.name} ({ing.quantity || 'as needed'})
                        </span>
                      ))}
                      {recipe.ingredients.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{recipe.ingredients.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog 
                        open={editingRecipe?.id === recipe.id} 
                        onOpenChange={open => {
                          if (!open) {
                            setEditingRecipe(null);
                            resetForm();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(recipe)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Recipe</DialogTitle>
                            <DialogDescription>Update recipe details.</DialogDescription>
                          </DialogHeader>
                          <RecipeForm />
                          <Button onClick={handleUpdate} className="w-full">
                            Update Recipe
                          </Button>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(recipe.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecipeManager;