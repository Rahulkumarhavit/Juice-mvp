import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/supabase/client";
import Papa from "papaparse";

interface ImportResult {
  success: boolean;
  rowsProcessed: number;
  errors: {
    row: number;
    message: string;
  }[];
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CSVImport = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"ingredients" | "recipes">("ingredients");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = async (type: "ingredients" | "recipes") => {
    let csvContent = "";

    try {
      if (type === "ingredients") {
        // Fetch categories from backend
        const { data: categories, error } = await supabase
          .from('categories')
          .select('name')
          .order('name');

        if (error) throw error;

        if (!categories || categories.length === 0) {
          toast({
            title: "Error",
            description: "No categories found in database",
            variant: "destructive"
          });
          return;
        }

        // Create example rows using actual categories
        const exampleRows = categories.map((cat, index) => {
          const examples = ['Apple', 'Orange', 'Carrot', 'Spinach', 'Ginger'];
          return `${examples[index] || 'Example'},${cat.name}`;
        }).join('\n');

        csvContent = `name,category\n${exampleRows}`;
      } else {
        // Fetch sample ingredients for recipe template
        const { data: ingredients, error } = await supabase
          .from('ingredients')
          .select('name')

        if (error) throw error;

        const sampleIngredients = ingredients && ingredients.length > 0
          ? ingredients.map(ing => ing.name).join('|')
          : 'Apple|Spinach|Ginger';

        const sampleQuantities = ingredients && ingredients.length > 0
          ? ingredients.map(() => '1 cup').join('|')
          : '2 medium|1 cup|1 inch';

        csvContent = `name,description,yield_oz,directions,ingredients,quantities\nMorning Green Boost,A refreshing green juice,16,Wash all ingredients. Juice and serve.,${sampleIngredients},${sampleQuantities}\nSweet Beet Energy,Energizing beet blend,12.5,Peel and juice. Serve chilled.,${sampleIngredients},${sampleQuantities}`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_template.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to generate template: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "Error",
        description: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        setPreviewData(results.data);
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const allData = results.data as any[];
        const errors: { row: number; message: string }[] = [];

        try {
          if (importType === "ingredients") {
            // Get categories and existing ingredients
            const [{ data: categoriesData }, { data: existingIngredients }] = await Promise.all([
              supabase.from('categories').select('*'),
              supabase.from('ingredients').select('name')
            ]);

            const categoryMap = new Map(
              categoriesData?.map(cat => [cat.name.toLowerCase(), cat.id]) || []
            );

            const existingIngredientNames = new Set(
              existingIngredients?.map(ing => ing.name.toLowerCase()) || []
            );

            for (let i = 0; i < allData.length; i++) {
              const row = allData[i];

              if (!row.name || row.name.trim() === "") {
                errors.push({ row: i + 2, message: "Missing ingredient name" });
                continue;
              }

              if (!row.category || row.category.trim() === "") {
                errors.push({ row: i + 2, message: "Missing category" });
                continue;
              }

              // Check for duplicates
              if (existingIngredientNames.has(row.name.toLowerCase())) {
                errors.push({ row: i + 2, message: `Ingredient '${row.name}' already exists` });
                continue;
              }

              const categoryId = categoryMap.get(row.category.toLowerCase());
              if (!categoryId) {
                errors.push({ row: i + 2, message: `Category '${row.category}' not found` });
                continue;
              }

              const { error } = await supabase
                .from('ingredients')
                .insert({
                  name: row.name,
                  category_id: categoryId
                });

              if (error) {
                errors.push({ row: i + 2, message: error.message });
              } else {
                // Add to set to prevent duplicates within the same import
                existingIngredientNames.add(row.name.toLowerCase());
              }
            }
          } else {
            // Import recipes
            const [{ data: ingredientsData }, { data: existingRecipes }] = await Promise.all([
              supabase.from('ingredients').select('id, name'),
              supabase.from('recipes').select('name')
            ]);

            const ingredientMap = new Map(
              ingredientsData?.map(ing => [ing.name.toLowerCase(), ing.id]) || []
            );

            const existingRecipeNames = new Set(
              existingRecipes?.map(recipe => recipe.name.toLowerCase()) || []
            );

            for (let i = 0; i < allData.length; i++) {
              const row = allData[i];

              if (!row.name || row.name.trim() === "") {
                errors.push({ row: i + 2, message: "Missing recipe name" });
                continue;
              }

              // Check for duplicates
              if (existingRecipeNames.has(row.name.toLowerCase())) {
                errors.push({ row: i + 2, message: `Recipe '${row.name}' already exists` });
                continue;
              }

              if (!row.ingredients || row.ingredients.trim() === "") {
                errors.push({ row: i + 2, message: "Missing ingredients" });
                continue;
              }

              if (!row.yield_oz || isNaN(parseFloat(row.yield_oz))) {
                errors.push({ row: i + 2, message: "Invalid or missing yield" });
                continue;
              }

              // Insert recipe
              const { data: newRecipe, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                  name: row.name,
                  description: row.description || "",
                  yield_oz: parseFloat(row.yield_oz),
                  directions: row.directions || ""
                })
                .select()
                .single();

              if (recipeError) {
                errors.push({ row: i + 2, message: recipeError.message });
                continue;
              }

              // Parse ingredients (pipe-separated)
              const ingredientNames = row.ingredients.split("|").map((s: string) => s.trim());
              const quantities = row.quantities ? row.quantities.split("|").map((s: string) => s.trim()) : [];

              let recipeIngredientsSuccess = true;

              for (let j = 0; j < ingredientNames.length; j++) {
                const ingName = ingredientNames[j];
                const ingId = ingredientMap.get(ingName.toLowerCase());

                if (!ingId) {
                  errors.push({ row: i + 2, message: `Ingredient '${ingName}' not found` });
                  recipeIngredientsSuccess = false;
                  continue;
                }

                const { error: ingredientError } = await supabase
                  .from('recipe_ingredients')
                  .insert({
                    recipe_id: newRecipe.id,
                    ingredient_id: ingId,
                    quantity: quantities[j] || null
                  });

                if (ingredientError) {
                  errors.push({ row: i + 2, message: `Failed to add ingredient '${ingName}': ${ingredientError.message}` });
                  recipeIngredientsSuccess = false;
                }
              }

              // If recipe ingredients failed, delete the recipe to maintain data integrity
              if (!recipeIngredientsSuccess) {
                await supabase.from('recipes').delete().eq('id', newRecipe.id);
                errors.push({ row: i + 2, message: "Recipe deleted due to ingredient errors" });
              } else {
                // Add to set to prevent duplicates within the same import
                existingRecipeNames.add(row.name.toLowerCase());
              }
            }
          }

          const result: ImportResult = {
            success: errors.length === 0,
            rowsProcessed: allData.length,
            errors
          };

          setImportResult(result);

          if (result.success) {
            toast({
              title: "Success",
              description: `Successfully imported ${result.rowsProcessed} ${importType}`
            });
            setSelectedFile(null);
            setPreviewData([]);
          } else {
            toast({
              title: "Import completed with errors",
              description: `${errors.length} error(s) found. Check details below.`,
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
        }

        setImporting(false);
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive"
        });
        setImporting(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Import Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="importType" 
                value="ingredients" 
                checked={importType === "ingredients"} 
                onChange={e => setImportType(e.target.value as any)} 
                className="w-4 h-4" 
              />
              <span className="text-sm">Ingredients</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="importType" 
                value="recipes" 
                checked={importType === "recipes"} 
                onChange={e => setImportType(e.target.value as any)} 
                className="w-4 h-4" 
              />
              <span className="text-sm">Recipes</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => downloadTemplate("ingredients")}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download Ingredients Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadTemplate("recipes")}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download Recipes Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <div className="flex items-center gap-4">
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileSelect} 
              className="flex-1" 
            />
            {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
          </div>
        </div>

        {previewData.length > 0 && (
          <div className="space-y-2">
            <Label>Preview (first 5 rows)</Label>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0]).map(key => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value: any, i) => (
                        <TableCell key={i}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <Button 
          onClick={handleImport} 
          disabled={!selectedFile || importing} 
          className="w-full gap-2"
        >
          <Upload className="w-4 h-4" />
          {importing ? "Importing..." : `Import ${importType === "ingredients" ? "Ingredients" : "Recipes"}`}
        </Button>
      </div>

      {importResult && (
        <Alert variant={importResult.success ? "default" : "destructive"}>
          {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {importResult.success ? "Import Successful" : "Import Completed with Errors"}
          </AlertTitle>
          <AlertDescription>
            {importResult.success ? (
              <p>Successfully imported {importResult.rowsProcessed} rows.</p>
            ) : (
              <div className="space-y-2">
                <p>{importResult.errors.length} error(s) found:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CSVImport;