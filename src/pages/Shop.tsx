import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopItemModal } from "@/components/ShopItemModal";
import { shopItems, type ShopItem } from "@/lib/shopItems";
import { useBadges } from "@/hooks/useBadges";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Coins, Store } from "lucide-react";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

const Shop = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  
  const { userCredits, isLoading: creditsLoading } = useBadges(user?.id || null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading shop">
        <div className="animate-pulse text-4xl" aria-hidden="true">🛒</div>
        <span className="sr-only">Loading shop...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-6 md:py-10">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-4" aria-hidden="true">🔒</div>
              <h2 className="text-xl font-semibold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-4">
                Please log in to access the Dice Pro Shop.
              </p>
              <Button asChild>
                <Link to="/">Go to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <header className="mb-6 md:mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Game
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1 flex items-center justify-center gap-2">
              <Store className="w-8 h-8" aria-hidden="true" />
              Dice Pro Shop
            </h1>
            <p className="text-muted-foreground">
              Exclusive items for dedicated players
            </p>
          </div>
        </header>

        {/* Credit balance */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Balance</p>
                  {creditsLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{userCredits}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
          </CardContent>
        </Card>

        {/* Shop items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span aria-hidden="true">🎁</span> Available Items
          </h2>
          
          {shopItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Item icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-3xl">
                    <span aria-hidden="true">{item.emoji}</span>
                  </div>
                  
                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.shortDescription}
                    </p>
                    
                    {/* Price */}
                    <div className="mt-2 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="font-bold text-foreground">{item.price}</span>
                      <span className="text-sm text-muted-foreground">credits</span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedItem(item)}
                  >
                    Read More
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    Unlock (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>More items coming soon!</p>
          <Link to="/terms" className="hover:underline mt-2 inline-block">Terms and Conditions</Link>
        </footer>
      </div>

      {/* Item detail modal */}
      <ShopItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};

export default Shop;
