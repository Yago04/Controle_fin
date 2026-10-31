import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fincontrol.app',
  appName: 'FinControl Life OS',
  webDir: 'out',
  server: {
    // Conectado diretamente à Vercel de produção (funciona em qualquer lugar do mundo no 4G/5G/Wi-Fi)
    url: 'https://controle-fin-beta.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
