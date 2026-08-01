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
      colors: {
        background: {
          app: "var(--color-app-bg)",
          surface: "var(--color-surface)",
          elevated: "var(--color-elevated)",
        },
        border: {
          divider: "var(--color-border)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          disabled: "var(--color-text-disabled)",
          "on-primary": "var(--color-text-on-primary)",
        },
        brand: {
          primary: "var(--color-primary)",
          "primary-pressed": "var(--color-primary-pressed)",
          "primary-highlight": "var(--color-primary-highlight)",
        },
        status: {
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          danger: "var(--color-danger)",
          info: "var(--color-info)",
        },
        input: {
          background: "var(--color-input-bg)",
          disabled: "var(--color-input-disabled)",
          focus: "var(--color-input-focus)",
        },
      },
      boxShadow: {
        custom: "0 4px 6px var(--color-shadow)",
      },
    },
  },
  plugins: [],
};
