import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import { Category, Ingredient, supabase } from "@/supabase/client";

const IngredientManager = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    emoji: "", 
    category_id: "",
    is_popular: false 
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchIngredients();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch categories: " + error.message,
        variant: "destructive",
      });
    }
  };

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setIngredients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch ingredients: " + error.message,
        variant: "destructive",
      });
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
        setFormData({ ...formData, emoji: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.category_id) {
      toast({
        title: "Error",
        description: "Ingredient name and category are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert([{
          name: formData.name,
          emoji: formData.emoji || "🔸",
          category_id: formData.category_id,
          is_popular: formData.is_popular,
        }])
        .select();

      if (error) throw error;

      setIngredients([...ingredients, data[0]]);
      setFormData({ name: "", emoji: "", category_id: "", is_popular: false });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Ingredient added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      emoji: ingredient.emoji,
      category_id: ingredient.category_id,
      is_popular: ingredient.is_popular || false,
    });
  };

  const handleUpdate = async () => {
    if (!editingIngredient) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .update({
          name: formData.name,
          emoji: formData.emoji,
          category_id: formData.category_id,
          is_popular: formData.is_popular,
        })
        .eq('id', editingIngredient.id)
        .select();

      if (error) throw error;

      setIngredients(
        ingredients.map((ing) =>
          ing.id === editingIngredient.id ? data[0] : ing
        )
      );
      setEditingIngredient(null);
      setFormData({ name: "", emoji: "", category_id: "", is_popular: false });
      toast({
        title: "Success",
        description: "Ingredient updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;

    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIngredients(ingredients.filter((ing) => ing.id !== id));
      toast({
        title: "Success",
        description: "Ingredient deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {ingredients.length} ingredient(s) available
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
              <DialogDescription>
                Create a new ingredient for your juice recipes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ingredient Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mango"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <div className="flex gap-2">
                  <Input
                    id="emoji"
                    placeholder="🥭"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_popular"
                  checked={formData.is_popular}
                  onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_popular">Mark as popular</Label>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Ingredient"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Emoji</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Popular</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell className="font-medium">{ingredient.name}</TableCell>
                <TableCell>{ingredient.emoji}</TableCell>
                <TableCell>{getCategoryName(ingredient.category_id)}</TableCell>
                <TableCell>{ingredient.is_popular ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog
                      open={editingIngredient?.id === ingredient.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingIngredient(null);
                          setFormData({ name: "", emoji: "", category_id: "", is_popular: false });
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ingredient)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Ingredient</DialogTitle>
                          <DialogDescription>
                            Update ingredient details.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Ingredient Name *</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-category">Category *</Label>
                            <Select
                              value={formData.category_id}
                              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-emoji">Emoji</Label>
                            <div className="flex gap-2">
                              <Input
                                id="edit-emoji"
                                value={formData.emoji}
                                onChange={(e) =>
                                  setFormData({ ...formData, emoji: e.target.value })
                                }
                                className="flex-1"
                              />
                              <input
                                ref={editFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => editFileInputRef.current?.click()}
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-is_popular"
                              checked={formData.is_popular}
                              onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="edit-is_popular">Mark as popular</Label>
                          </div>
                          <Button onClick={handleUpdate} className="w-full" disabled={loading}>
                            {loading ? "Updating..." : "Update Ingredient"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ingredient.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IngredientManager;