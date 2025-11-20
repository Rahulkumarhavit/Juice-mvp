import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const {
    toast
  } = useToast();
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
  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive"
      });
      return;
    }

    // Simulate import process
    const errors: {
      row: number;
      message: string;
    }[] = [];

    // Validate data
    previewData.forEach((row, index) => {
      if (importType === "ingredients") {
        if (!row.name || row.name.trim() === "") {
          errors.push({
            row: index + 2,
            message: "Missing ingredient name"
          });
        }
      } else {
        if (!row.title || row.title.trim() === "") {
          errors.push({
            row: index + 2,
            message: "Missing recipe title"
          });
        }
        if (!row.ingredients || row.ingredients.trim() === "") {
          errors.push({
            row: index + 2,
            message: "Missing required ingredients"
          });
        }
        if (!row.yield || isNaN(parseInt(row.yield))) {
          errors.push({
            row: index + 2,
            message: "Invalid or missing yield"
          });
        }
      }
    });
    const result: ImportResult = {
      success: errors.length === 0,
      rowsProcessed: previewData.length,
      errors
    };
    setImportResult(result);
    if (result.success) {
      toast({
        title: "Success",
        description: `Successfully imported ${result.rowsProcessed} ${importType}`
      });
    } else {
      toast({
        title: "Import completed with errors",
        description: `${errors.length} error(s) found. Check details below.`,
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6">
      

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Import Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="importType" value="ingredients" checked={importType === "ingredients"} onChange={e => setImportType(e.target.value as any)} className="w-4 h-4" />
              <span className="text-sm">Ingredients</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="importType" value="recipes" checked={importType === "recipes"} onChange={e => setImportType(e.target.value as any)} className="w-4 h-4" />
              <span className="text-sm">Recipes</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <div className="flex items-center gap-4">
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileSelect} className="flex-1" />
            {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
          </div>
        </div>

        {previewData.length > 0 && <div className="space-y-2">
            <Label>Preview (first 5 rows)</Label>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => <TableRow key={index}>
                      {Object.values(row).map((value: any, i) => <TableCell key={i}>{value}</TableCell>)}
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </div>}

        <Button onClick={handleImport} disabled={!selectedFile} className="w-full gap-2">
          <Upload className="w-4 h-4" />
          Import {importType === "ingredients" ? "Ingredients" : "Recipes"}
        </Button>
      </div>

      {importResult && <Alert variant={importResult.success ? "default" : "destructive"}>
          {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {importResult.success ? "Import Successful" : "Import Completed with Errors"}
          </AlertTitle>
          <AlertDescription>
            {importResult.success ? <p>Successfully imported {importResult.rowsProcessed} rows.</p> : <div className="space-y-2">
                <p>{importResult.errors.length} error(s) found:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {importResult.errors.map((error, index) => <li key={index}>
                      Row {error.row}: {error.message}
                    </li>)}
                </ul>
              </div>}
          </AlertDescription>
        </Alert>}
    </div>;
};
export default CSVImport;