/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
      extend: {
        typography: (theme) => ({
          DEFAULT: {
            css: {
              code: {
                color: theme('colors.purple.600'),
                backgroundColor: theme('colors.gray.100'),
                padding: '0.1rem 0.3rem',
                borderRadius: '0.25rem',
                fontWeight: '400',
              },
              'code::before': {
                content: '""',
              },
              'code::after': {
                content: '""',
              },
            },
          },
          dark: {
            css: {
              color: theme('colors.gray.300'),
              code: {
                color: theme('colors.purple.400'),
                backgroundColor: theme('colors.gray.700'),
              },
              h1: {
                color: theme('colors.gray.200'),
              },
              h2: {
                color: theme('colors.gray.200'),
              },
              h3: {
                color: theme('colors.gray.200'),
              },
              h4: {
                color: theme('colors.gray.200'),
              },
              a: {
                color: theme('colors.purple.400'),
              },
              strong: {
                color: theme('colors.gray.200'),
              },
            },
          },
        }),
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
  }