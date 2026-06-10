import { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.tiremax.erp',
  appName: 'TireMax ERP',
  webDir: 'dist',

  // ─── Live Reload em desenvolvimento ──────────────────────────────────────
  // Descomente e altere para o IP da sua máquina para testar sem rebuild:
  // server: {
  //   url: 'http://192.168.1.100:5173',
  //   cleartext: true,
  // },

  // ─── Android ─────────────────────────────────────────────────────────────
  android: {
    allowMixedContent: false,        // true somente se backend for HTTP (não HTTPS)
    captureInput: true,              // melhora captura de inputs
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0c14',
    loggingBehavior: 'none',         // remover logs em produção
    minWebViewVersion: 60,
    appendUserAgent: 'TireMaxERP/1.0 Android',
  },

  // ─── iOS ─────────────────────────────────────────────────────────────────
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0c14',
    scrollEnabled: true,
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    appendUserAgent: 'TireMaxERP/1.0 iOS',
    limitsNavigationsToAppBoundDomains: true,
  },

  // ─── Plugins ─────────────────────────────────────────────────────────────
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#0a0c14',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#3b64ff',
    },

    // Status Bar
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0d1020',
      overlaysWebView: false,
    },

    // Teclado
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },

    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Notificações Locais
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3b64ff',
      sound: 'beep.wav',
    },

    // Orientação de tela (portrait por padrão, ajuste se necessário)
    ScreenOrientation: {
      // Permite portrait e landscape
    },
  },
};

export default config;
