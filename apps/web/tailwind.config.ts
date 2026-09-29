import type { Config } from "tailwindcss";

/**
 * Design tokens extraídos do projeto legado (`legacy/front/src/app.css`).
 *
 * No Tailwind CSS v4 a configuração primária é CSS-first (`@theme` em
 * `src/app/globals.css`); este arquivo é carregado via `@config` e espelha
 * os mesmos tokens (cores, fontes e raio) para uso em ferramentas JS e para
 * manter a paridade com o legado em um único lugar de referência.
 */
const config: Config = {
  theme: {
    extend: {
      colors: {
        // Paleta principal do legado (oklch)
        "sage-green": {
          50: "oklch(97.16% 0.016 130.42)",
          100: "oklch(94.30% 0.033 129.70)",
          150: "oklch(91.37% 0.049 129.92)",
          200: "oklch(88.43% 0.064 130.14)",
          300: "oklch(82.80% 0.097 130.68)",
          400: "oklch(77.31% 0.129 131.03)",
          450: "oklch(74.67% 0.167 131.67)",
          500: "oklch(71.89% 0.157 132.15)",
          600: "oklch(61.02% 0.131 131.98)",
          700: "oklch(49.57% 0.104 132.21)",
          800: "oklch(37.49% 0.074 131.97)",
          850: "oklch(31.06% 0.059 131.76)",
          900: "oklch(24.63% 0.044 131.56)",
          950: "oklch(20.46% 0.032 130.48)",
        },
        // Tokens semânticos (shadcn) — referenciam as variáveis do :root/.dark
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
        },
      },
      fontFamily: {
        sans: ["'Instrument Sans Variable'", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["'Lora Variable'", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "calc(var(--radius) * 0.6)",
        md: "calc(var(--radius) * 0.8)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) * 1.4)",
        "2xl": "calc(var(--radius) * 1.8)",
        "3xl": "calc(var(--radius) * 2.2)",
        "4xl": "calc(var(--radius) * 2.6)",
      },
    },
  },
  plugins: [],
};

export default config;
