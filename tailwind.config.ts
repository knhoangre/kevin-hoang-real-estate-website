import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
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
        },
        // The site's three surfaces and two accents. Each of these was an
        // arbitrary hex repeated across dozens of files (`text-[#1a1a1a]` alone
        // appeared 265 times) before it was named here.
        //
        // Champagne needs TWO values because #c5a572 measures 2.33:1 on white
        // and 2.20:1 on bone — it fails WCAG at every size on a light surface,
        // while measuring 8.31:1 on ink-deep. One token cannot serve both.
        //
        //   token          allowed                                forbidden
        //   ------------------------------------------------------------------
        //   champagne      any foreground on ink-deep.            text-champagne on
        //                  On light surfaces ONLY as a            white or bone.
        //                  non-text mark: bg- rules,              text-white on
        //                  decoration-, marker:text-,             bg-champagne.
        //                  border-, ring-.
        //   champagne-ink  text-* on white/bone: links,           any foreground on
        //                  active nav labels, eyebrows.           ink-deep (3.94:1).
        //   ink            text on white/bone; bg-ink             text on ink-deep.
        //                  with white text.
        //   ink-deep       section backgrounds; text on           small text on a
        //                  bg-champagne (8.31:1).                 light surface.
        //   bone           section and card backgrounds.          text of any size.
        //
        // Colour that carries MEANING rather than brand is exempt: the amber
        // review stars, the blue important-notice panels on /buyer and /seller,
        // form-error red, and the blue/purple roadmap accents, which are the
        // only thing distinguishing the buyer and seller guides at a glance.
        ink: "#1a1a1a",           // 17.40:1 on white
        "ink-deep": "#0d0d0f",    // the dark surface: heroes, strip, CTA band
        bone: "#faf8f5",          // the warm light surface
        champagne: "#c5a572",     // 8.31:1 on ink-deep, 2.33:1 on white
        "champagne-ink": "#8c6b35", // same hue, 4.92:1 on white / 4.64:1 on bone
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
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        // Display serif for the landing-page heroes. Playfair Display is used
        // because it carries a full Vietnamese subset — a display face without
        // one drops the diacritics back to a fallback mid-headline.
        display: ["Playfair Display", "Georgia", "serif"],
      }
    }
  },
  // @tailwindcss/typography was a dependency for months without ever being
  // registered here, so every `prose` class on the site was inert — the
  // landing-page bodies, blog posts, town guides and legal pages all rendered
  // as undifferentiated walls of text with no heading scale, list markers or
  // paragraph rhythm.
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
