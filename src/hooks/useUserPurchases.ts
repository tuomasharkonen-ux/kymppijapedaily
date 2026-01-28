import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PurchaseResult {
  success: boolean;
  itemId?: string;
  itemName?: string;
  newBalance?: number;
  error?: string;
}

export const useUserPurchases = (userId: string | null) => {
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchPurchases = useCallback(async () => {
    if (!userId) {
      setPurchasedItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_purchases")
        .select("item_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching purchases:", error);
        return;
      }

      setPurchasedItems(data?.map((p) => p.item_id) || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const purchaseItem = async (itemId: string): Promise<PurchaseResult> => {
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    setIsPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-item", {
        body: { itemId },
      });

      if (error) {
        console.error("Purchase function error:", error);
        return { success: false, error: error.message || "Purchase failed" };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      // Update local state
      setPurchasedItems((prev) => [...prev, itemId]);

      return {
        success: true,
        itemId: data.itemId,
        itemName: data.itemName,
        newBalance: data.newBalance,
      };
    } catch (error) {
      console.error("Purchase error:", error);
      return { success: false, error: "Purchase failed" };
    } finally {
      setIsPurchasing(false);
    }
  };

  const isOwned = useCallback(
    (itemId: string) => purchasedItems.includes(itemId),
    [purchasedItems]
  );

  return {
    purchasedItems,
    isLoading,
    isPurchasing,
    purchaseItem,
    isOwned,
    refetchPurchases: fetchPurchases,
  };
};
