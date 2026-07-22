// Central place for the backend API URL.
//
// Locally: falls back to http://localhost:5000 automatically — no setup needed for dev.
// In production: set VITE_API_URL in your deployment platform's environment variables
// (e.g. Vercel/Netlify) to your live backend URL, e.g. https://devmatch-backend.onrender.com
//
// Vite only exposes env vars prefixed with VITE_ to the browser bundle.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
