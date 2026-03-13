/**
 * Native bridge — Capacitor plugin wrappers.
 * No-ops on the web (graceful degradation).
 * Only activates inside the Capacitor native shell.
 */

export const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();

/** Detect if running as installed PWA (standalone mode) */
export const isPWA = typeof window !== 'undefined' && (
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true
);

/** Initialize status bar theming */
export async function initStatusBar() {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a1a' });
  } catch {}
}

/** Hide splash screen (auto-shown on launch via config) */
export async function initSplashScreen() {
  if (!isNative) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {}
}

/** Request push notification permission and register */
export async function initPushNotifications() {
  if (!isNative) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      await PushNotifications.register();
    }
    PushNotifications.addListener('registration', (token) => {
      console.log('Push token:', token.value);
    });
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });
  } catch {}
}

/** Trigger haptic feedback */
export async function hapticFeedback(style = 'Medium') {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle[style] });
  } catch {}
}

/** Initialize all native features on app load */
export async function initNative() {
  if (!isNative) return;
  await initStatusBar();
  await initSplashScreen();
  setTimeout(() => initPushNotifications(), 5000);
}
