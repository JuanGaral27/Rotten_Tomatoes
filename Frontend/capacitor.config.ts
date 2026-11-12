import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rottentomatoes.app',
  appName: 'Rotten Tomatoes',
  webDir: 'dist/Frontend/browser',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;