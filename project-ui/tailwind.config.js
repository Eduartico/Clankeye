module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        noto: ["Noto Sans", "sans-serif"],
      },
      colors: {
        lochmara: {
          50: "#f2f8fd",
          100: "#e4effa",
          200: "#c3dff4",
          300: "#8fc5ea",
          400: "#53a7dd",
          500: "#2980b9",
          600: "#1e6fab",
          700: "#19598b",
          800: "#194c73",
          900: "#1a4060",
          950: "#112940",
        },
      },
    },
  },
  plugins: [],
};
