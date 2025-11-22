import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/supabase/client";

interface ImportResult {
  success: boolean;
  rowsProcessed: number;
  errors: {
    row: number;
    message: string;
  }[];
}

const CSVImport = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"ingredients" | "recipes">("ingredients");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = (type: "ingredients" | "recipes") => {
    let csvContent = "";
    
    if (type === "ingredients") {
      csvContent = "name,category\nApple,Fruits\nOrange,Citrus\nCarrot,Vegetables\nSpinach,Vegetables\nGinger,Herbs & Spices";
    } else {
      csvContent = "name,description,yield_oz,directions,ingredients,quantities\nMorning Green Boost,A refreshing green juice,16,Wash all ingredients. Juice and serve.,Apple|Spinach|Ginger,2 medium|1 cup|1 inch\nSweet Beet Energy,Energizing beet blend,12,Peel and juice. Serve chilled.,Beet|Carrot|Lemon,1 large|2 medium|1/2";
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
    setSelectedFile(file);
    setImportResult(null);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(",").map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
      setPreviewData(data);
    };
    reader.readAsText(file);
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
    const errors: { row: number; message: string }[] = [];

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim());
        const allData = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });
          return row;
        });

        if (importType === "ingredients") {
          // Get categories
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('*');
          
          const categoryMap = new Map(
            categoriesData?.map(cat => [cat.name.toLowerCase(), cat.id]) || []
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
            }
          }
        } else {
          // Import recipes
          const { data: ingredientsData } = await supabase
            .from('ingredients')
            .select('id, name');
          
          const ingredientMap = new Map(
            ingredientsData?.map(ing => [ing.name.toLowerCase(), ing.id]) || []
          );

          for (let i = 0; i < allData.length; i++) {
            const row = allData[i];
            
            if (!row.name || row.name.trim() === "") {
              errors.push({ row: i + 2, message: "Missing recipe name" });
              continue;
            }

            if (!row.ingredients || row.ingredients.trim() === "") {
              errors.push({ row: i + 2, message: "Missing ingredients" });
              continue;
            }

            if (!row.yield_oz || isNaN(parseInt(row.yield_oz))) {
              errors.push({ row: i + 2, message: "Invalid or missing yield" });
              continue;
            }

            // Insert recipe
            const { data: newRecipe, error: recipeError } = await supabase
              .from('recipes')
              .insert({
                name: row.name,
                description: row.description || "",
                yield_oz: parseInt(row.yield_oz),
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

            for (let j = 0; j < ingredientNames.length; j++) {
              const ingName = ingredientNames[j];
              const ingId = ingredientMap.get(ingName.toLowerCase());
              
              if (!ingId) {
                errors.push({ row: i + 2, message: `Ingredient '${ingName}' not found` });
                continue;
              }

              await supabase
                .from('recipe_ingredients')
                .insert({
                  recipe_id: newRecipe.id,
                  ingredient_id: ingId,
                  quantity: quantities[j] || null
                });
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
        
        setImporting(false);
      };
      
      reader.readAsText(selectedFile);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setImporting(false);
    }
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