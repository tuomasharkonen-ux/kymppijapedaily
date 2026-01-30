import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		keyframes: {
			'accordion-down': {
				from: {
					height: '0'
				},
				to: {
					height: 'var(--radix-accordion-content-height)'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: '0'
				}
			},
			'dice-roll': {
				'0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
				'25%': { transform: 'rotateX(180deg) rotateY(90deg)' },
				'50%': { transform: 'rotateX(360deg) rotateY(180deg)' },
				'75%': { transform: 'rotateX(540deg) rotateY(270deg)' },
				'100%': { transform: 'rotateX(720deg) rotateY(360deg)' }
			},
			'dice-bounce': {
				'0%, 100%': { transform: 'translateY(0)' },
				'50%': { transform: 'translateY(-10px)' }
			},
			'shake': {
				'0%, 100%': { transform: 'translateX(0)' },
				'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
				'20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
			},
			'pop-in': {
				'0%': { transform: 'scale(0)', opacity: '0' },
				'50%': { transform: 'scale(1.2)' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			},
		'pulse-glow': {
			'0%, 100%': { boxShadow: '0 0 5px hsl(var(--primary) / 0.3)' },
			'50%': { boxShadow: '0 0 15px hsl(var(--primary) / 0.6)' }
		},
		'shimmer': {
			'0%': { boxShadow: '0 0 20px hsl(217 91% 60% / 0.3)' },
			'50%': { boxShadow: '0 0 40px hsl(217 91% 60% / 0.5)' },
			'100%': { boxShadow: '0 0 20px hsl(217 91% 60% / 0.3)' }
		},
		'glow-pulse': {
			'0%, 100%': { boxShadow: '0 0 30px hsl(270 91% 65% / 0.4)' },
			'50%': { boxShadow: '0 0 50px hsl(270 91% 65% / 0.6)' }
		},
		'legendary-glow': {
			'0%, 100%': { boxShadow: '0 0 40px hsl(45 93% 47% / 0.5)' },
			'50%': { boxShadow: '0 0 80px hsl(45 93% 47% / 0.8)' }
		},
		'epic-entrance': {
			'0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
			'50%': { transform: 'scale(1.2) rotate(10deg)' },
			'100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
		},
		'legendary-entrance': {
			'0%': { transform: 'scale(0) rotate(-360deg)', opacity: '0' },
			'40%': { transform: 'scale(1.3) rotate(20deg)' },
			'60%': { transform: 'scale(0.9) rotate(-10deg)' },
			'80%': { transform: 'scale(1.1) rotate(5deg)' },
			'100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
		},
		'float': {
			'0%, 100%': { transform: 'translateY(0)' },
			'50%': { transform: 'translateY(-8px)' }
		},
		'border-glow': {
			'0%, 100%': { boxShadow: '0 0 12px hsl(var(--primary) / 0.25), inset 0 0 0 1px hsl(var(--primary) / 0.15)' },
			'50%': { boxShadow: '0 0 24px hsl(var(--primary) / 0.45), inset 0 0 0 1px hsl(var(--primary) / 0.3)' }
		},
		'dice-shake-intense': {
			'0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
			'10%': { transform: 'translateX(-3px) rotate(-2deg)' },
			'20%': { transform: 'translateX(3px) rotate(2deg)' },
			'30%': { transform: 'translateX(-5px) rotate(-3deg)' },
			'40%': { transform: 'translateX(5px) rotate(3deg)' },
			'50%': { transform: 'translateX(-7px) rotate(-4deg)' },
			'60%': { transform: 'translateX(7px) rotate(4deg)' },
			'70%': { transform: 'translateX(-5px) rotate(-3deg)' },
			'80%': { transform: 'translateX(5px) rotate(2deg)' },
			'90%': { transform: 'translateX(-2px) rotate(-1deg)' }
		},
		'dice-blow': {
			'0%': { transform: 'translateX(0) rotate(0deg) scale(1)' },
			'20%': { transform: 'translateX(4px) rotate(3deg) scale(1.02)' },
			'40%': { transform: 'translateX(8px) rotate(5deg) scale(1.05)' },
			'60%': { transform: 'translateX(4px) rotate(3deg) scale(1.02)' },
			'80%': { transform: 'translateX(2px) rotate(1deg) scale(1.01)' },
			'100%': { transform: 'translateX(0) rotate(0deg) scale(1)' }
		},
		'scramble-pulse': {
			'0%, 100%': { opacity: '1', transform: 'scale(1)' },
			'50%': { opacity: '0.7', transform: 'scale(0.95)' }
		}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'dice-roll': 'dice-roll 0.6s ease-out',
			'dice-bounce': 'dice-bounce 0.3s ease-in-out',
			'shake': 'shake 0.5s ease-in-out',
			'pop-in': 'pop-in 0.4s ease-out',
			'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
			'shimmer': 'shimmer 2s ease-in-out infinite',
			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
			'legendary-glow': 'legendary-glow 1.5s ease-in-out infinite',
			'epic-entrance': 'epic-entrance 0.6s ease-out forwards',
			'legendary-entrance': 'legendary-entrance 0.8s ease-out forwards',
			'float': 'float 2s ease-in-out infinite',
			'border-glow': 'border-glow 2.5s ease-in-out infinite',
			'dice-shake-intense': 'dice-shake-intense 0.8s ease-in-out',
			'dice-blow': 'dice-blow 0.8s ease-in-out',
			'scramble-pulse': 'scramble-pulse 1.5s ease-in-out infinite'
		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		fontFamily: {
  			sans: [
  				'Work Sans',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Inconsolata',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
