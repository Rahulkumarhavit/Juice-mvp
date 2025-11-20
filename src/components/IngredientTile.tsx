import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
interface IngredientTileProps {
  name: string;
  emoji: string;
  image: string;
  isSelected: boolean;
  isPopular?: boolean;
  onClick: () => void;
}
const IngredientTile = ({
  name,
  emoji,
  image,
  isSelected,
  isPopular = false,
  onClick
}: IngredientTileProps) => {
  return <button onClick={onClick} className={cn("relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-smooth shadow-soft hover:shadow-hover", "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", isSelected ? "border-primary bg-primary/5 scale-[0.98]" : "border-border bg-card hover:border-primary/50 hover:scale-[1.02]")}>
      {isPopular && <div className="absolute top-1 right-1">
          
        </div>}
      
      <div className="w-12 h-12 flex items-center justify-center">
        <img src={image} alt={name} className="w-full h-full object-cover rounded-md" />
      </div>
      
      <span className="font-medium text-[11px] text-foreground text-center leading-tight">
        {name}
      </span>
      
      {isSelected && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-soft">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>}
    </button>;
};
export default IngredientTile;