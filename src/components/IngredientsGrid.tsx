import IngredientTile from "./IngredientTile";

export interface Ingredient {
  name: string;
  emoji: string;
  image: string;
  isPopular?: boolean;
  category: string;
}

interface IngredientsGridProps {
  ingredients: Ingredient[];
  selectedIngredients: string[];
  onToggle: (ingredient: string) => void;
}

const IngredientsGrid = ({ 
  ingredients, 
  selectedIngredients, 
  onToggle 
}: IngredientsGridProps) => {
  // Group ingredients by category
  const groupedIngredients = ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  // Define category order
  const categoryOrder = ['Fruits', 'Citrus', 'Vegetables', 'Herbs & Spices', 'Nuts & Seeds', 'Sweeteners'];
  const sortedCategories = categoryOrder.filter(cat => groupedIngredients[cat]);

  return (
    <section className="container px-4 py-8">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          Tap the ingredients you have — we'll find juices that use them
        </p>
      </div>
      
      {sortedCategories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">{category}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-3">
            {groupedIngredients[category].map((ingredient) => (
              <IngredientTile
                key={ingredient.name}
                name={ingredient.name}
                emoji={ingredient.emoji}
                image={ingredient.image}
                isSelected={selectedIngredients.includes(ingredient.name)}
                isPopular={ingredient.isPopular}
                onClick={() => onToggle(ingredient.name)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default IngredientsGrid;
