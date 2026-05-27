/** @type {import('tailwindcss').Config} */
export default {
    content: ["./templates/**/*.twig", "./assets/**/*.{js,css}", "./src/**/*.php"],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
};
