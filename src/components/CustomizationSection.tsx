import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { shopItems } from "@/lib/shopItems";
import { Palette, Sparkles, Zap, Image, ToggleRight } from "lucide-react";

interface CustomizationSectionProps {
  purchasedItems: string[];
  activeSkin: string | null;
  activeActions: string[];
  activeThrowAnimation: string | null;
  activeBackground: string | null;
  onSkinChange: (skinId: string | null) => void;
  onActionToggle: (actionId: string) => void;
  onThrowAnimationChange: (animationId: string | null) => void;
  onBackgroundChange: (backgroundId: string | null) => void;
  hiddenFeatures?: string[];
  onFeatureToggle?: (featureId: string) => void;
  isLoading?: boolean;
}

// What each owned feature switch controls
const FEATURE_LABELS: Record<string, { label: string; description: string }> = {
  betting_license: { label: "Bets & Pot of the Day", description: "Betting slip, jackpot and the daily pot" },
  mokki_plot: { label: "Mökki", description: "Your island on the home screen" },
};

export const CustomizationSection = ({
  purchasedItems,
  activeSkin,
  activeActions,
  activeThrowAnimation,
  activeBackground,
  onSkinChange,
  onActionToggle,
  onThrowAnimationChange,
  onBackgroundChange,
  hiddenFeatures = [],
  onFeatureToggle,
  isLoading = false,
}: CustomizationSectionProps) => {
  const ownedFeatures = shopItems.filter(
    (item) => item.category === "feature" && purchasedItems.includes(item.id)
  );
  const ownedSkins = shopItems.filter(
    (item) => item.category === "skin" && purchasedItems.includes(item.id)
  );
  const ownedActions = shopItems.filter(
    (item) => item.category === "action" && purchasedItems.includes(item.id)
  );
  const ownedThrowAnimations = shopItems.filter(
    (item) => item.category === "throw_animation" && purchasedItems.includes(item.id)
  );
  const ownedBackgrounds = shopItems.filter(
    (item) => item.category === "background" && purchasedItems.includes(item.id)
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

  const hasOwnedItems = ownedFeatures.length > 0 || ownedSkins.length > 0 || ownedActions.length > 0 || ownedThrowAnimations.length > 0 || ownedBackgrounds.length > 0;

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
        {/* Features Section: hide bought features without losing them */}
        {ownedFeatures.length > 0 && onFeatureToggle && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ToggleRight className="h-4 w-4" />
              Features
            </h3>
            <div className="space-y-3">
              {ownedFeatures.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`feature-${feature.id}`} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-lg">{feature.emoji}</span>
                    <span>
                      <span className="block">{FEATURE_LABELS[feature.id]?.label ?? feature.name}</span>
                      {FEATURE_LABELS[feature.id] && (
                        <span className="block text-xs text-muted-foreground">{FEATURE_LABELS[feature.id].description}</span>
                      )}
                    </span>
                  </Label>
                  <Switch
                    id={`feature-${feature.id}`}
                    checked={!hiddenFeatures.includes(feature.id)}
                    onCheckedChange={() => onFeatureToggle(feature.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Throw Animations Section */}
        {ownedThrowAnimations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Throw Animations
            </h3>
            <div className="space-y-3">
              {ownedThrowAnimations.map((animation) => (
                <div
                  key={animation.id}
                  className="flex items-center justify-between"
                >
                  <Label
                    htmlFor={`animation-${animation.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-lg">{animation.emoji}</span>
                    <span>{animation.name}</span>
                  </Label>
                  <Switch
                    id={`animation-${animation.id}`}
                    checked={activeThrowAnimation === animation.id}
                    onCheckedChange={(checked) =>
                      onThrowAnimationChange(checked ? animation.id : null)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backgrounds Section */}
        {ownedBackgrounds.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Image className="h-4 w-4" />
              Game Backgrounds
            </h3>
            <div className="space-y-3">
              {ownedBackgrounds.map((bg) => (
                <div
                  key={bg.id}
                  className="flex items-center justify-between"
                >
                  <Label
                    htmlFor={`bg-${bg.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-lg">{bg.emoji}</span>
                    <span>{bg.name}</span>
                  </Label>
                  <Switch
                    id={`bg-${bg.id}`}
                    checked={activeBackground === bg.id}
                    onCheckedChange={(checked) =>
                      onBackgroundChange(checked ? bg.id : null)
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
