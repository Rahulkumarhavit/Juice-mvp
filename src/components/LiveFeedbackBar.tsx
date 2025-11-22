import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface LiveFeedbackBarProps {
  recipeCount: number;
  hasSelection: boolean;
}
const LiveFeedbackBar = ({
  recipeCount,
  hasSelection
}: LiveFeedbackBarProps) => {
  if (!hasSelection) {
    return <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container px-4 py-4">
          <div className="text-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              No ingredients selected yet. Start tapping to see what you can make!
            </p>
          </div>
        </div>
      </div>;
  }
  return 
};
export default LiveFeedbackBar;