import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages project sites, set base to your repo name before deploying, e.g.:
// base: '/nz-climate-tracker/'
// For local development and most static hosts, './' is portable.
export default defineConfig({
  plugins: [react()],
  base: './'
});
