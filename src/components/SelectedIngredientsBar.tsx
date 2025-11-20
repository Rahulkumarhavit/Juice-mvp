import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SelectedIngredientsBarProps {
  selectedIngredients: string[];
  onRemove: (ingredient: string) => void;
  onClearAll: () => void;
}

const SelectedIngredientsBar = ({ 
  selectedIngredients, 
  onRemove, 
  onClearAll 
}: SelectedIngredientsBarProps) => {
  if (selectedIngredients.length === 0) return null;

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                Selected: {selectedIngredients.length} ingredients
              </span>
              {/* Clear button next to text on mobile only */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 sm:hidden"
              >
                Clear all
              </Button>
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {selectedIngredients.map((ingredient) => (
                <Badge 
                  key={ingredient} 
                  variant="secondary"
                  className="gap-0.5 pl-2 pr-1 py-0.5 sm:gap-1 sm:pl-3 sm:pr-1.5 sm:py-1 text-xs sm:text-sm transition-smooth hover:bg-destructive/10"
                >
                  {ingredient}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 p-0 hover:bg-destructive/20"
                    onClick={() => onRemove(ingredient)}
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
          {/* Clear button on right side for desktop */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearAll}
            className="hidden sm:block text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedIngredientsBar;
