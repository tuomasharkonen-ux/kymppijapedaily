import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { shopItems } from "@/lib/shopItems";
import { Palette, Sparkles } from "lucide-react";

interface CustomizationSectionProps {
  purchasedItems: string[];
  activeSkin: string | null;
  activeActions: string[];
  onSkinChange: (skinId: string | null) => void;
  onActionToggle: (actionId: string) => void;
  isLoading?: boolean;
}

export const CustomizationSection = ({
  purchasedItems,
  activeSkin,
  activeActions,
  onSkinChange,
  onActionToggle,
  isLoading = false,
}: CustomizationSectionProps) => {
  const ownedSkins = shopItems.filter(
    (item) => item.category === "skin" && purchasedItems.includes(item.id)
  );
  const ownedActions = shopItems.filter(
    (item) => item.category === "action" && purchasedItems.includes(item.id)
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasOwnedItems = ownedSkins.length > 0 || ownedActions.length > 0;

  if (!hasOwnedItems) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skins Section */}
        {ownedSkins.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Dice Skins
            </h3>
            <div className="space-y-3">
              {ownedSkins.map((skin) => (
                <div
                  key={skin.id}
                  className="flex items-center justify-between"
                >
                  <Label
                    htmlFor={`skin-${skin.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-lg">{skin.emoji}</span>
                    <span>{skin.name}</span>
                  </Label>
                  <Switch
                    id={`skin-${skin.id}`}
                    checked={activeSkin === skin.id}
                    onCheckedChange={(checked) =>
                      onSkinChange(checked ? skin.id : null)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Section */}
        {ownedActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Actions
            </h3>
            <div className="space-y-3">
              {ownedActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between"
                >
                  <Label
                    htmlFor={`action-${action.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-lg">{action.emoji}</span>
                    <span>{action.name}</span>
                  </Label>
                  <Switch
                    id={`action-${action.id}`}
                    checked={activeActions.includes(action.id)}
                    onCheckedChange={() => onActionToggle(action.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
