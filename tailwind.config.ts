import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        "background-alt": "#0A0A0A",
        primary: "#6366F1",
        accent: "#EC4899",
        orange: {
          400: "#FB923C",
          500: "#F97316",
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",
        "gradient-orange": "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
        "gradient-progress": "linear-gradient(90deg, #F97316 0%, #FBBF24 50%, #22C55E 100%)",
        "gradient-radial": "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-sm": "0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.2)",
        "glow-md": "0 0 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.5), 0 0 80px rgba(236, 72, 153, 0.3), 0 0 120px rgba(99, 102, 241, 0.2)",
        "glow-orange": "0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)",
        "glow-pink": "0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "stagger": "stagger 0.5s ease-out both",
        "glow": "glow 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-3d": "float-3d 4s ease-in-out infinite",
        progress: "progress 3s ease-in-out infinite",
        "count-up": "countUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stagger: {
          "0%": { opacity: "0", transform: "translateY(15px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.3)",
          },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-20px) rotate(120deg)" },
          "66%": { transform: "translateY(20px) rotate(240deg)" },
        },
        "float-3d": {
          "0%, 100%": {
            transform: "translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
            opacity: "0.8",
          },
          "25%": {
            transform: "translateY(-30px) translateZ(20px) rotateX(10deg) rotateY(90deg) rotateZ(5deg)",
            opacity: "1",
          },
          "50%": {
            transform: "translateY(-20px) translateZ(10px) rotateX(0deg) rotateY(180deg) rotateZ(10deg)",
            opacity: "0.9",
          },
          "75%": {
            transform: "translateY(-35px) translateZ(25px) rotateX(-10deg) rotateY(270deg) rotateZ(5deg)",
            opacity: "1",
          },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.1)" },
        },
        progress: {
          "0%": { width: "0%" },
          "50%": { width: "70%" },
          "100%": { width: "100%" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "4xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
