/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#070b10",
          raised: "#0c1219",
          card: "#111821",
          muted: "#161e28",
        },
        accent: {
          DEFAULT: "#3ddab4",
          dim: "#1a6b58",
          soft: "#3ddab422",
        },
        radiant: {
          DEFAULT: "#3ddab4",
          dim: "#0d2e28",
          border: "#1f8f75",
        },
        dire: {
          DEFAULT: "#f07178",
          dim: "#2a1218",
          border: "#9e3d48",
        },
        mana: {
          DEFAULT: "#5eb0f0",
          dim: "#0f2438",
          border: "#2a6da0",
        },
        gold: {
          DEFAULT: "#e8c547",
          dim: "#2a2410",
          border: "#8a7328",
        },
        day: {
          DEFAULT: "#f0c94a",
        },
      },
    },
  },
  plugins: [],
};
