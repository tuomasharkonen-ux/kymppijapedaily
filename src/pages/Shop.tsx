import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopItemModal } from "@/components/ShopItemModal";
import { PurchaseSuccessModal } from "@/components/PurchaseSuccessModal";
import { shopItems, type ShopItem } from "@/lib/shopItems";
import { useBadges } from "@/hooks/useBadges";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Coins, Store, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface PurchaseSuccess {
  item: ShopItem;
  newBalance: number;
}

// Reusable item card component
interface ShopItemCardProps {
  item: ShopItem;
  itemState: "owned" | "can_buy" | "too_expensive";
  onSelect: () => void;
  purchasesLoading: boolean;
}

const ShopItemCard = ({ item, itemState, onSelect, purchasesLoading }: ShopItemCardProps) => {
  const owned = itemState === "owned";
  const canBuy = itemState === "can_buy";

  return (
    <Card className={`overflow-hidden ${owned ? "border-primary/30 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Item icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center text-3xl relative">
            <span aria-hidden="true">{item.emoji}</span>
            {owned && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          
          {/* Item details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{item.name}</h3>
              {owned && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Owned
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.shortDescription}
            </p>
            
            {/* Price */}
            {!owned && (
              <div className="mt-2 flex items-center gap-1">
                <Coins className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="font-bold text-foreground">{item.price}</span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onSelect}
          >
            {owned ? "View Details" : "Read More"}
          </Button>
          {owned ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled
            >
              <Check className="w-4 h-4 mr-1" />
              Owned
            </Button>
          ) : (
            <Button
              variant={canBuy ? "default" : "secondary"}
              size="sm"
              className="flex-1"
              disabled={!canBuy || purchasesLoading}
              onClick={onSelect}
            >
              {canBuy ? `Unlock` : "Not enough credits"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


const Shop = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseSuccess | null>(null);
  
  const { userCredits, isLoading: creditsLoading, refetchBadges } = useBadges(user?.id || null);
  const { isOwned, isLoading: purchasesLoading, purchaseItem, isPurchasing } = useUserPurchases(user?.id || null);
  const { updateSkin, activateAction, updateThrowAnimation, updateBackground } = useUserSettings(user?.id || null);

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

  const handlePurchaseSuccess = async (item: ShopItem, newBalance: number) => {
    // Auto-activate the purchased item
    if (item.category === 'skin') {
      await updateSkin(item.id);
    } else if (item.category === 'action') {
      await activateAction(item.id);
    } else if (item.category === 'throw_animation') {
      await updateThrowAnimation(item.id);
    } else if (item.category === 'background') {
      await updateBackground(item.id);
    }
    
    setPurchaseSuccess({ item, newBalance });
    refetchBadges();
  };

  const handleCloseSuccessModal = () => {
    setPurchaseSuccess(null);
  };

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

  const getItemState = (item: ShopItem): "owned" | "can_buy" | "too_expensive" => {
    if (isOwned(item.id)) return "owned";
    if (userCredits >= item.price) return "can_buy";
    return "too_expensive";
  };

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

        {/* Shop items by category */}
        <div className="space-y-8">
          {/* Dice Skins */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span aria-hidden="true">🎨</span> Dice Skins
              </h2>
              <p className="text-sm text-muted-foreground">
                Change how your dice look with exclusive visual styles
              </p>
            </div>
            <div className="space-y-4">
              {shopItems.filter(item => item.category === 'skin').map((item) => (
                <ShopItemCard 
                  key={item.id} 
                  item={item} 
                  itemState={getItemState(item)}
                  onSelect={() => setSelectedItem(item)}
                  purchasesLoading={purchasesLoading}
                />
              ))}
            </div>
          </section>

          {/* Special Actions */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span aria-hidden="true">🎬</span> Special Actions
              </h2>
              <p className="text-sm text-muted-foreground">
                Interact with your dice in fun and unique ways
              </p>
            </div>
            <div className="space-y-4">
              {shopItems.filter(item => item.category === 'action').map((item) => (
                <ShopItemCard 
                  key={item.id} 
                  item={item} 
                  itemState={getItemState(item)}
                  onSelect={() => setSelectedItem(item)}
                  purchasesLoading={purchasesLoading}
                />
              ))}
            </div>
          </section>

          {/* Throw Animations */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span aria-hidden="true">⚡</span> Throw Animations
              </h2>
              <p className="text-sm text-muted-foreground">
                Add dramatic flair to every dice roll
              </p>
            </div>
            <div className="space-y-4">
              {shopItems.filter(item => item.category === 'throw_animation').map((item) => (
                <ShopItemCard 
                  key={item.id} 
                  item={item} 
                  itemState={getItemState(item)}
                  onSelect={() => setSelectedItem(item)}
                  purchasesLoading={purchasesLoading}
                />
              ))}
            </div>
          </section>

          {/* Game Backgrounds */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span aria-hidden="true">🖼️</span> Game Backgrounds
              </h2>
              <p className="text-sm text-muted-foreground">
                Transform the look of your game board
              </p>
            </div>
            <div className="space-y-4">
              {shopItems.filter(item => item.category === 'background').map((item) => (
                <ShopItemCard 
                  key={item.id} 
                  item={item} 
                  itemState={getItemState(item)}
                  onSelect={() => setSelectedItem(item)}
                  purchasesLoading={purchasesLoading}
                />
              ))}
            </div>
          </section>
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
        isOwned={selectedItem ? isOwned(selectedItem.id) : false}
        canAfford={selectedItem ? userCredits >= selectedItem.price : false}
        onPurchase={purchaseItem}
        isPurchasing={isPurchasing}
        onPurchaseSuccess={(newBalance) => {
          if (selectedItem) {
            handlePurchaseSuccess(selectedItem, newBalance);
          }
        }}
      />

      {/* Purchase success celebration modal */}
      <PurchaseSuccessModal
        item={purchaseSuccess?.item ?? null}
        isOpen={!!purchaseSuccess}
        onClose={handleCloseSuccessModal}
        newBalance={purchaseSuccess?.newBalance ?? 0}
      />
    </div>
  );
};

export default Shop;
