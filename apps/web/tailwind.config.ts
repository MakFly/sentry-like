import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			dashboard: {
  				bg: 'hsl(var(--dashboard-bg))',
  				surface: 'hsl(var(--dashboard-surface))',
  				border: 'hsl(var(--dashboard-border))'
  			},
  			status: {
  				critical: 'hsl(var(--status-critical))',
  				warning: 'hsl(var(--status-warning))',
  				caution: 'hsl(var(--status-caution))',
  				healthy: 'hsl(var(--status-healthy))',
  				live: 'hsl(var(--accent-live))'
  			},
  			stats: {
  				bg: 'hsl(var(--stats-bg))',
  				surface: 'hsl(var(--stats-surface))',
  				border: 'hsl(var(--stats-border))'
  			},
  			frost: 'hsl(var(--accent-frost))',
  			gold: 'hsl(var(--accent-gold))',
  			insight: 'hsl(var(--accent-insight))',
  			issues: {
  				bg: 'hsl(var(--issues-bg))',
  				surface: 'hsl(var(--issues-surface))',
  				border: 'hsl(var(--issues-border))'
  			},
  			pulse: {
  				DEFAULT: 'hsl(var(--pulse-primary))',
  				primary: 'hsl(var(--pulse-primary))',
  				secondary: 'hsl(var(--pulse-secondary))',
  				muted: 'hsl(var(--pulse-muted))'
  			},
  			signal: {
  				fatal: 'hsl(var(--signal-fatal))',
  				error: 'hsl(var(--signal-error))',
  				warning: 'hsl(var(--signal-warning))',
  				info: 'hsl(var(--signal-info))',
  				debug: 'hsl(var(--signal-debug))'
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
  		}
  	}
  },
  plugins: [animate],
};

export default config;
