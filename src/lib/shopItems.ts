export interface ShopItem {
  id: string;
  emoji: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  category: 'skin' | 'action' | 'throw_animation' | 'background';
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
    id: 'sauna_dice',
    emoji: '🪵',
    name: 'Sauna Dice',
    shortDescription: 'The sauna heats up with every throw — reach MAX LÖYLY!',
    longDescription: 'Straight from a Finnish lakeside sauna, these birchwood dice transform your whole game board into a sauna. A traditional dial thermometer tracks the heat — keep rolling and watch the steam thicken, the numbers change colour, and the room shake as the löyly builds. Each roll sends water droplets bursting upward like a ladle hitting hot stones. Can you reach MAXIMUM LÖYLY? Hyvää saunaa! 🧖',
    price: 600,
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
    id: 'helldivers_dice',
    emoji: '🪖',
    name: 'Helldivers Stratagems',
    shortDescription: 'Black dice with six stratagem icons + cinematic victory animations!',
    longDescription: 'FOR SUPER EARTH! Six legendary Helldivers 2 stratagems replace the pips on jet-black dice — Orbital Napalm Barrage, Bastion MK XVI, Autocannon Sentry, Hellbomb, Eagle 500KG Bomb, and Orbital Laser. But that\'s not all, Helldiver: each face triggers its own full-screen cinematic when you Kymppijape on it. Win on Hellbombs and the screen goes white. Win on the 500KG and watch the mushroom cloud bloom. Managed Democracy has never looked this good.',
    price: 800,
    category: 'skin',
  },
  {
    id: 'sieni_dice',
    emoji: '🍄',
    name: 'Suomen Sienet',
    shortDescription: 'Six classic Finnish mushrooms on wooden dice — each Kymppijape triggers its own metsä cinematic!',
    longDescription: 'Suoraan Suomen syysmetsästä! Six of the nation\'s most beloved (and most feared) mushrooms replace the pips on birchwood dice — Kantarelli, Suppilovahvero, Herkkutatti, Korvasieni, Mustatorvisieni, and the unmistakable Kärpässieni. But sienestys has never been this dramatic: land your Kymppijape and each mushroom blooms into its own full-screen cinematic. Strike gold on the Kantarelli (SUIII!), brave the toxic fumes of the Korvasieni, or trip out entirely on the Kärpässieni. Muista: älä syö tuntemattomia sieniä! 🍄🇫🇮',
    price: 750,
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
  {
    id: 'turbo_spin_throw',
    emoji: '🌀',
    name: 'Turbo Spin',
    shortDescription: 'Blazing 5x rotation with intense motion blur!',
    longDescription: 'Why settle for a single rotation when you can have FIVE? The Turbo Spin animation sends your dice into a lightning-fast quintuple spin that would make an Olympic figure skater jealous. The intense motion blur effect adds that extra touch of pure speed demon energy. Warning: May cause dizziness in susceptible viewers and envy in other players.',
    price: 200,
    category: 'throw_animation',
  },
  {
    id: 'bounce_drop_throw',
    emoji: '⬇️',
    name: 'Bounce Drop',
    shortDescription: 'Dice fall from above and bounce before settling!',
    longDescription: 'Experience the satisfying physics of dice that know how to make an entrance! Watch as your dice dramatically plummet from the heavens, bouncing with delightful elasticity before settling into their final positions. Each bounce builds the suspense. Will it be a good roll? The anticipation is half the fun!',
    price: 200,
    category: 'throw_animation',
  },
  {
    id: 'casino_felt_bg',
    emoji: '🎰',
    name: 'Casino Felt',
    shortDescription: 'Classic green casino table with subtle vignette.',
    longDescription: 'Step into the high-roller lounge with this luxurious casino felt background! The rich green baize creates an authentic gambling atmosphere, complete with a subtle vignette effect that draws all eyes to your dice. Every roll feels like a million-dollar bet in Monte Carlo. Dealer not included.',
    price: 300,
    category: 'background',
  },
  {
    id: 'starfield_bg',
    emoji: '🌌',
    name: 'Starfield',
    shortDescription: 'Twinkling stars with a slow cosmic drift.',
    longDescription: 'Launch your dice into the cosmos with this mesmerizing Starfield background! Hundreds of twinkling stars drift slowly across a deep space canvas, creating an otherworldly atmosphere for every roll. The gentle parallax motion and varying star brightness make each game feel like a journey through the galaxy. Your dice have never looked so astronomical!',
    price: 500,
    category: 'background',
  },
];
