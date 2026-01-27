import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Store, ArrowRight, Coins } from "lucide-react";

interface DiceProShopCardProps {
  userCredits: number;
}

export const DiceProShopCard = ({ userCredits }: DiceProShopCardProps) => {
  return (
    <Card className="relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-full" aria-hidden="true" />
      
      <CardHeader className="pb-3 relative">
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true">🛒</span> Dice Pro Shop
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Credits Display */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Balance</p>
            <p className="text-xl font-bold text-foreground">{userCredits} credits</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
          </div>
          
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              Spend your hard-earned credits on exclusive dice skins, special actions, and more!
            </p>
            
            <div className="flex items-center gap-1 text-xs text-primary">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>New items available</span>
            </div>
          </div>
        </div>
        
        <Button asChild className="w-full gap-2" variant="default">
          <Link to="/shop">
            Enter the Shop
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
