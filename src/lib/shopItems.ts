export interface ShopItem {
  id: string;
  emoji: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  category: 'skin' | 'action';
}

export const shopItems: ShopItem[] = [
  {
    id: 'golden_dice',
    emoji: '✨',
    name: 'Golden Dice',
    shortDescription: 'Makes your dice gold colored and shiny.',
    longDescription: 'Transform your ordinary dice into magnificent golden cubes that shimmer and shine with every roll! The Golden Dice skin gives your game a luxurious feel, making every throw feel like a winner. Watch as the golden surface catches the light, creating a dazzling display that will make other players envious of your premium style.',
    price: 200,
    category: 'skin',
  },
  {
    id: 'diamond_dice',
    emoji: '💎',
    name: 'Diamond Dice',
    shortDescription: 'Makes your dice very shiny and diamond colored.',
    longDescription: 'The ultimate in dice luxury! These crystal-clear Diamond Dice sparkle with an otherworldly brilliance that puts even the finest gems to shame. Each face of the die refracts light into a spectacular rainbow display, creating a mesmerizing visual experience with every roll. Only the most dedicated players can afford this level of prestige.',
    price: 500,
    category: 'skin',
  },
  {
    id: 'german_supermarket_dice',
    emoji: '🛒',
    name: 'German Supermarket Dice',
    shortDescription: 'Yellow, blue and red colored dice. Sehr gut!',
    longDescription: 'Inspired by everyone\'s favorite budget-friendly German supermarket chain! These dice feature the iconic yellow, blue, and red color scheme that shoppers worldwide know and love. Roll with the efficiency and quality that German engineering is famous for. Batteries not included, but at these prices, who\'s complaining?',
    price: 100,
    category: 'skin',
  },
  {
    id: 'shake_dice_action',
    emoji: '🫨',
    name: 'Shake Dice Action',
    shortDescription: 'Shake the dice before throwing for extra luck!',
    longDescription: 'Unlock the ancient art of dice shaking! This special action allows you to vigorously shake your dice before each throw, channeling your inner luck energy into the cubes. While scientifically proven to do absolutely nothing, many players swear by this ritual for achieving the perfect roll. The placebo effect has never been more fun!',
    price: 300,
    category: 'action',
  },
  {
    id: 'blow_dice_action',
    emoji: '💨',
    name: 'Blow Dice Action',
    shortDescription: 'Blow at the dice before throwing for extra luck!',
    longDescription: 'Master the mystical technique of dice blowing! This exclusive action lets you gently blow on your dice before each roll, whispering your wishes to the gaming gods. Does it actually improve your odds? Absolutely not! But it sure feels important, and that\'s what really matters in life. Your dice, your breath, your destiny!',
    price: 300,
    category: 'action',
  },
  {
    id: 'insult_dice_action',
    emoji: '🤬',
    name: 'Insult Your Dice',
    shortDescription: 'Verbally abuse your dice for better luck!',
    longDescription: 'Channel your inner rage at those underperforming cubes! Scientific studies (that we made up) show that insulting your dice improves luck by 0%. But it feels AMAZING. Each click unleashes a random insult from 50 increasingly unhinged options that would make a sailor blush. Warning: Dice have feelings too. We think.',
    price: 300,
    category: 'action',
  },
];
