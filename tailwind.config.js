/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        alabaster: "#FAF9F6",
        charcoal: "#252321",
        stoneLine: "#CCC5BD",
        quiet: "#6B655F"
      },
      fontFamily: {
        serif: ["Lora", "Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "Montserrat", "Arial", "sans-serif"]
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        breathe: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.85" }
        }
      },
      animation: {
        fadeIn: "fadeIn 600ms ease-out both",
        breathe: "breathe 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
