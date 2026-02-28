/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS variables for tenant branding — set at runtime from API data
        primary: "var(--color-primary, #3B82F6)",
        secondary: "var(--color-secondary, #1E40AF)",
      },
    },
  },
  plugins: [],
};
