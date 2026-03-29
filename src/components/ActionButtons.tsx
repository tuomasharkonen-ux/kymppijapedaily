 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { shopItems } from "@/lib/shopItems";
 import { staggerContainer, staggerItem, tapScale } from "@/lib/animations";
 
 export type ActionType = 'shake' | 'blow' | 'insult';
 
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
   'insult_dice_action': 'insult',
 };
 
 const actionLabels: Record<ActionType, string> = {
   shake: 'Shake',
   blow: 'Blow',
   insult: 'Insult',
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
     <motion.div 
       className="flex gap-2 mt-3 w-full"
       variants={staggerContainer}
       initial="initial"
       animate="animate"
     >
       {availableActions.map((action) => {
         const actionType = actionItemMap[action.id];
         if (!actionType) return null;
         
         return (
           <motion.div
             key={action.id}
             variants={staggerItem}
             className="flex-1"
             whileHover={{ scale: 1.02 }}
             whileTap={tapScale}
           >
             <Button
               variant="secondary"
               size="sm"
               onClick={() => onActionClick(actionType)}
               disabled={disabled || isAnimating}
               aria-label={`${action.name} - ${action.shortDescription}`}
               className="w-full"
             >
               <span aria-hidden="true">{action.emoji}</span>
               <span className="ml-1">{actionLabels[actionType]}</span>
             </Button>
           </motion.div>
         );
       })}
     </motion.div>
   );
 };
