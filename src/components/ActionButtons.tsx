import { Button } from "@/components/ui/button";
import { shopItems } from "@/lib/shopItems";

export type ActionType = 'shake' | 'blow';

interface ActionButtonsProps {
  purchasedItems: string[];
  activeActions: string[];
  onActionClick: (actionType: ActionType) => void;
  disabled?: boolean;
  isAnimating?: boolean;
}

const actionItemMap: Record<string, ActionType> = {
  'shake_dice_action': 'shake',
  'blow_dice_action': 'blow',
};

export const ActionButtons = ({ 
  purchasedItems,
  activeActions,
  onActionClick, 
  disabled = false,
  isAnimating = false 
}: ActionButtonsProps) => {
  // Filter to only show actions that are both owned AND active
  const availableActions = shopItems.filter(
    item => 
      item.category === 'action' && 
      purchasedItems.includes(item.id) &&
      activeActions.includes(item.id)
  );

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-3 w-full">
      {availableActions.map((action) => {
        const actionType = actionItemMap[action.id];
        if (!actionType) return null;
        
        return (
          <Button
            key={action.id}
            variant="secondary"
            size="sm"
            onClick={() => onActionClick(actionType)}
            disabled={disabled || isAnimating}
            aria-label={`${action.name} - ${action.shortDescription}`}
            className="flex-1"
          >
            <span aria-hidden="true">{action.emoji}</span>
            <span className="ml-1">{actionType === 'shake' ? 'Shake' : 'Blow'}</span>
          </Button>
        );
      })}
    </div>
  );
};
