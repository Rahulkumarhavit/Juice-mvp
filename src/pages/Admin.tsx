// import { useState } from "react";
// import Header from "@/components/Header";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Plus, Edit, Trash2, Upload } from "lucide-react";
// import IngredientManager from "@/components/admin/IngredientManager";
// import RecipeManager from "@/components/admin/RecipeManager";
// import CSVImport from "@/components/admin/CSVImport";

// const Admin = () => {
//   const [activeTab, setActiveTab] = useState("ingredients");

//   return (
//     <div className="min-h-screen bg-background">
//       <Header />
      
//       <main className="container px-4 py-8">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
//           <p className="text-muted-foreground">
//             Manage your ingredients, recipes, and import data
//           </p>
//         </div>

//         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <TabsList className="grid w-full grid-cols-3 max-w-2xl">
//             <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
//             <TabsTrigger value="recipes">Recipes</TabsTrigger>
//             <TabsTrigger value="import">CSV Import</TabsTrigger>
//           </TabsList>

//           <TabsContent value="ingredients" className="mt-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Ingredients Manager</CardTitle>
//                 <CardDescription>
//                   View and manage your list of ingredients.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <IngredientManager />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="recipes" className="mt-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Recipes Manager</CardTitle>
//                 <CardDescription>
//                   Create or update juice recipes with full details.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <RecipeManager />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="import" className="mt-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>CSV Import</CardTitle>
//                 <CardDescription>
//                   Quickly import multiple recipes or ingredients from a CSV file.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <CSVImport />
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </main>

//       <footer className="border-t py-8 mt-12 bg-muted/30">
//         <div className="container px-4 text-center">
//           <p className="text-sm text-muted-foreground">
//             Admin Dashboard - JuiceMatch
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Admin;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import IngredientManager from "@/components/admin/IngredientManager";
import RecipeManager from "@/components/admin/RecipeManager";
import CSVImport from "@/components/admin/CSVImport";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("ingredients");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/auth");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/admin/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your ingredients, recipes, and import data
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="import">CSV Import</TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingredients Manager</CardTitle>
                <CardDescription>
                  View and manage your list of ingredients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IngredientManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipes Manager</CardTitle>
                <CardDescription>
                  Create or update juice recipes with full details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecipeManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CSV Import</CardTitle>
                <CardDescription>
                  Quickly import multiple recipes or ingredients from a CSV file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVImport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-8 mt-12 bg-muted/30">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Admin Dashboard - JuiceMatch
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Admin;