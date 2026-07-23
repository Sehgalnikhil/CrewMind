/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        crew: {
          50: "#F4F2FE",
          100: "#EAE7FD",
          200: "#CFC7FB",
          300: "#A395F4",
          400: "#8A7BEF",
          500: "#6C5CE7",
          600: "#5D4FC7",
          700: "#4E42A8",
          800: "#3E3585",
          900: "#2F2864",
          950: "#201B45",
        },
        surface: {
          DEFAULT: "#0B0D14",
          raised: "#12141F",
          card: "#171A26",
          border: "#242838",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(108, 92, 231, 0.45)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        }
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
        "marquee": "marquee 25s linear infinite",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
