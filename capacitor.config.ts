import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pragency.app',
  appName: 'PR Agency',
  webDir: 'www',
  server: {
    url: 'https://pragency.pages.dev',
    cleartext: false
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;
