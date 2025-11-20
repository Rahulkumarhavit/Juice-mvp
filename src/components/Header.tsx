import { Info, ArrowLeft, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Header = ({ showBackButton, onBackClick }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">
            My Juice Recipe
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isHomePage && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          )}
          
          {showBackButton && onBackClick && (
            <Button variant="ghost" size="sm" onClick={onBackClick} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">How it works</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>How My Juice Recipe Works</DialogTitle>
                <DialogDescription className="space-y-3 pt-4 text-left">
                  <p className="text-foreground">
                    Pick the fruits and veggies you have. We'll show you all the juices you can make right now!
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Tap ingredients you have at home</li>
                      <li>Watch the recipe counter update live</li>
                      <li>Hit "See Recipes" to view your matches</li>
                      <li>Best matches appear first!</li>
                    </ol>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};

export default Header;
