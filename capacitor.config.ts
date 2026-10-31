import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fincontrol.app',
  appName: 'FinControl Life OS',
  webDir: 'out',
  server: {
    // Permite que o app no iPhone (via Xcode) conecte ao servidor local na rede Wi-Fi
    url: 'http://192.168.0.5:3000',
    cleartext: true,
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
