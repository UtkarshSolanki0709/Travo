/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      /* ───── Colors: DESIGN.md Section 1 ───── */
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          elevated: 'hsl(var(--surface-elevated))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        /* Activity Category Colors */
        category: {
          food: 'hsl(var(--category-food))',
          sports: 'hsl(var(--category-sports))',
          arts: 'hsl(var(--category-arts))',
          nightlife: 'hsl(var(--category-nightlife))',
          music: 'hsl(var(--category-music))',
        },
      },

      /* ───── Spacing: DESIGN.md Section 2 (4px base) ───── */
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
        'space-12': '48px',
      },

      /* ───── Border Radius: DESIGN.md Section 2 ───── */
      borderRadius: {
        'radius-md': '16px',
        'radius-lg': '24px',
        'radius-full': '9999px',
      },

      /* ───── Border Width ───── */
      borderWidth: {
        hairline: '0.5px',
      },

      /* ───── Typography: DESIGN.md Section 3 ───── */
      fontFamily: {
        display: ['Poppins_700Bold', 'Poppins_800ExtraBold', 'System'],
        body: ['Inter_400Regular', 'Inter_500Medium', 'Inter_600SemiBold', 'System'],
      },
      fontSize: {
        'display-2xl': ['48px', { lineHeight: '52.8px', fontWeight: '800' }],
        'display-xl': ['36px', { lineHeight: '41.4px', fontWeight: '700' }],
        'heading-xl': ['28px', { lineHeight: '33.6px', fontWeight: '700' }],
        'heading-lg': ['22px', { lineHeight: '27.5px', fontWeight: '600' }],
        'heading-md': ['18px', { lineHeight: '23.4px', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '25.5px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '22.5px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18.2px', fontWeight: '500' }],
      },

      /* ───── Elevation: DESIGN.md Section 2 ───── */
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'elevation-3': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'elevation-4': '0 8px 16px rgba(0, 0, 0, 0.16)',
      },

      /* ───── Animation: DESIGN.md Section 6b ───── */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
