/**
 * capacitor.service.js
 * Wrapper centralizado para todas as funcionalidades nativas.
 * Funciona em Android, iOS e browser (web fallback automático).
 */

// ─── Detecção de plataforma ───────────────────────────────────────────────────
export const isNative = () =>
  typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true

export const getPlatform = () =>
  typeof window !== 'undefined' ? (window.Capacitor?.getPlatform?.() || 'web') : 'web'

export const isAndroid = () => getPlatform() === 'android'
export const isIos = () => getPlatform() === 'ios'
export const isWeb = () => getPlatform() === 'web'

// ─── App Lifecycle ────────────────────────────────────────────────────────────
export async function setupBackButton(callback) {
  if (!isAndroid()) return
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', callback)
  } catch { /* plugin indisponível */ }
}

export async function exitApp() {
  if (!isNative()) { window.close(); return }
  try {
    const { App } = await import('@capacitor/app')
    await App.exitApp()
  } catch { /* plugin indisponível */ }
}

export async function getAppInfo() {
  if (!isNative()) return { name: 'TireMax ERP', version: '1.0.0', build: '1' }
  try {
    const { App } = await import('@capacitor/app')
    return await App.getInfo()
  } catch { return null }
}

// ─── Status Bar ───────────────────────────────────────────────────────────────
export async function setupStatusBar() {
  if (!isNative()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#0d1020' })
      await StatusBar.setOverlaysWebView({ overlay: false })
    }
  } catch { /* plugin indisponível */ }
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
export async function hideSplashScreen(delay = 0) {
  if (!isNative()) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    if (delay > 0) await new Promise(r => setTimeout(r, delay))
    await SplashScreen.hide({ fadeOutDuration: 300 })
  } catch { /* plugin indisponível */ }
}

// ─── Keyboard ────────────────────────────────────────────────────────────────
export async function setupKeyboard() {
  if (!isNative()) return
  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open')
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
    })
  } catch { /* plugin indisponível */ }
}

// ─── Haptics ─────────────────────────────────────────────────────────────────
export async function hapticLight() {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch { /* plugin indisponível */ }
}

export async function hapticMedium() {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch { /* plugin indisponível */ }
}

export async function hapticSuccess() {
  if (!isNative()) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch { /* plugin indisponível */ }
}

export async function hapticError() {
  if (!isNative()) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Error })
  } catch { /* plugin indisponível */ }
}

// ─── Network ─────────────────────────────────────────────────────────────────
export async function getNetworkStatus() {
  if (!isNative()) return { connected: navigator.onLine, connectionType: 'wifi' }
  try {
    const { Network } = await import('@capacitor/network')
    return await Network.getStatus()
  } catch { return { connected: true, connectionType: 'unknown' } }
}

export async function onNetworkChange(callback) {
  if (!isNative()) {
    window.addEventListener('online', () => callback({ connected: true, connectionType: 'wifi' }))
    window.addEventListener('offline', () => callback({ connected: false, connectionType: 'none' }))
    return
  }
  try {
    const { Network } = await import('@capacitor/network')
    await Network.addListener('networkStatusChange', callback)
  } catch { /* plugin indisponível */ }
}

// ─── Storage nativo ───────────────────────────────────────────────────────────
export async function setPreference(key, value) {
  const val = typeof value === 'string' ? value : JSON.stringify(value)
  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key, value: val })
    }
  } catch { /* plugin indisponível — segue só com localStorage */ }
  localStorage.setItem(key, val)
}

export async function getPreference(key) {
  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key })
      return value
    }
  } catch { /* plugin indisponível — segue só com localStorage */ }
  return localStorage.getItem(key)
}

export async function removePreference(key) {
  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key })
    }
  } catch { /* plugin indisponível — segue só com localStorage */ }
  localStorage.removeItem(key)
}

// ─── Clipboard ───────────────────────────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    if (isNative()) {
      const { Clipboard } = await import('@capacitor/clipboard')
      await Clipboard.write({ string: text })
    } else {
      await navigator.clipboard.writeText(text)
    }
    return true
  } catch { return false }
}

// ─── Share ────────────────────────────────────────────────────────────────────
export async function shareContent({ title, text, url, dialogTitle } = {}) {
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share')
      const canShare = await Share.canShare()
      if (canShare.value) {
        await Share.share({ title, text, url, dialogTitle })
        return true
      }
    } else if (navigator.share) {
      await navigator.share({ title, text, url })
      return true
    }
  } catch { /* usuário cancelou ou plugin indisponível */ }
  return false
}

// ─── Camera ──────────────────────────────────────────────────────────────────
export async function takePhoto({ quality = 80, allowEditing = false } = {}) {
  if (isNative()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    return await Camera.getPhoto({
      quality,
      allowEditing,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    })
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) { reject(new Error('No file')); return }
      const reader = new FileReader()
      reader.onload = () => resolve({ dataUrl: reader.result, format: 'jpeg' })
      reader.onerror = reject
      reader.readAsDataURL(file)
    }
    input.click()
  })
}

// ─── Dialog nativo ────────────────────────────────────────────────────────────
export async function showConfirm(title, message, { okButtonTitle = 'OK', cancelButtonTitle = 'Cancelar' } = {}) {
  try {
    if (isNative()) {
      const { Dialog } = await import('@capacitor/dialog')
      const { value } = await Dialog.confirm({ title, message, okButtonTitle, cancelButtonTitle })
      return value
    }
  } catch { /* plugin indisponível */ }
  return window.confirm(`${title}\n${message}`)
}

export async function showPrompt(title, message, { inputPlaceholder = '', inputText = '', okButtonTitle = 'OK', cancelButtonTitle = 'Cancelar' } = {}) {
  try {
    if (isNative()) {
      const { Dialog } = await import('@capacitor/dialog')
      const { value, cancelled } = await Dialog.prompt({ title, message, inputPlaceholder, inputText, okButtonTitle, cancelButtonTitle })
      return cancelled ? null : value
    }
  } catch { /* plugin indisponível */ }
  return window.prompt(`${title}\n${message}`, inputText)
}

// ─── Local Notifications ─────────────────────────────────────────────────────
export async function scheduleNotification({ id, title, body, scheduleAt, extra } = {}) {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
    await LocalNotifications.schedule({
      notifications: [{
        id: id || Math.floor(Math.random() * 10000),
        title,
        body,
        schedule: scheduleAt ? { at: new Date(scheduleAt) } : undefined,
        extra,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#3b64ff',
      }],
    })
  } catch { /* plugin indisponível */ }
}

export async function scheduleStockAlert(productName, stock) {
  return scheduleNotification({
    title: 'Estoque Baixo — TireMax',
    body: `${productName} está com apenas ${stock} unidade(s) em estoque`,
  })
}

// ─── Push Notifications ───────────────────────────────────────────────────────
export async function setupPushNotifications({ onToken, onNotification, onAction } = {}) {
  if (!isNative()) return null
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return null
    await PushNotifications.register()
    if (onToken) PushNotifications.addListener('registration', ({ value }) => onToken(value))
    if (onNotification) PushNotifications.addListener('pushNotificationReceived', onNotification)
    if (onAction) PushNotifications.addListener('pushNotificationActionPerformed', onAction)
    return true
  } catch { return null }
}

// ─── Screen Orientation ───────────────────────────────────────────────────────
export async function lockPortrait() {
  if (!isNative()) return
  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation')
    await ScreenOrientation.lock({ orientation: 'portrait' })
  } catch { /* plugin indisponível */ }
}

export async function unlockOrientation() {
  if (!isNative()) return
  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation')
    await ScreenOrientation.unlock()
  } catch { /* plugin indisponível */ }
}

// ─── Filesystem ──────────────────────────────────────────────────────────────
export async function saveFile(fileName, data, { directory = 'DOCUMENTS' } = {}) {
  try {
    if (isNative()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const result = await Filesystem.writeFile({
        path: fileName,
        data,
        directory: Directory[directory],
        encoding: 'utf8',
        recursive: true,
      })
      return result.uri
    }
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    return fileName
  } catch { return null }
}
