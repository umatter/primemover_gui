/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  variants: {
    backgroundColor: ['responsive', 'first', 'last', 'even', 'odd', 'hover', 'focus']
  },
  theme: {
    extend: {}
  },
  plugins: [
    // ...
    require('@tailwindcss/forms')
  ]
};
