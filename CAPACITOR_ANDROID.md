# 📱 Guia — Gerar APK Android com Capacitor

## Pré-requisitos

| Ferramenta | Versão | Download |
|------------|--------|---------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net |
| Android Studio | Hedgehog+ | https://developer.android.com/studio |
| Android SDK | API 22+ | (instala com Android Studio) |

---

## Passo a passo

### 1. Instale as dependências do frontend

```bash
cd frontend
npm install
```

### 2. Configure a URL do backend

Crie o arquivo `frontend/.env` com o IP do seu servidor:

```env
# Use o IP local se backend e celular estiverem na mesma rede:
VITE_API_URL=http://192.168.1.100:3001

# Ou use sua URL de produção:
# VITE_API_URL=https://api.seudominio.com.br
```

> 💡 Para descobrir seu IP local: `ipconfig` (Windows) ou `ifconfig` / `ip a` (Linux/Mac)

### 3. Adicione a plataforma Android

```bash
cd frontend
npx cap add android
```

Isso cria a pasta `android/` com o projeto Android Studio.

### 4. Gere o build e sincronize

```bash
npm run cap:sync
# Equivale a: npm run build && cap sync android
```

### 5. Abra no Android Studio

```bash
npx cap open android
```

O Android Studio vai abrir automaticamente com o projeto.

### 6. Gere o APK de debug (para testar)

No Android Studio:
- Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- O APK ficará em: `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Instalar no celular (debug)

Com o celular conectado via USB (com depuração USB ativada):

```bash
# Via Android Studio: clique no botão ▶ Run
# Via terminal:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Gerar APK de Produção (Release)

### 1. Crie uma keystore (uma vez só)

```bash
keytool -genkey -v \
  -keystore tiremax-release.keystore \
  -alias tiremax \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 2. Configure a assinatura no Android Studio

Edite `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../tiremax-release.keystore')
            storePassword 'sua_senha'
            keyAlias 'tiremax'
            keyPassword 'sua_senha'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Gere o APK release

```bash
cd android
./gradlew assembleRelease
```

APK gerado em: `android/app/build/outputs/apk/release/app-release.apk`

---

## Publicar na Play Store

1. Gere um **AAB** (Android App Bundle) em vez de APK:
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   Arquivo: `android/app/build/outputs/bundle/release/app-release.aab`

2. Acesse https://play.google.com/console
3. Crie o app e faça upload do `.aab`
4. Preencha as informações e publique

> ⚠️ A conta de desenvolvedor Google custa **US$ 25 (única vez)**

---

## Atualizar o app

Sempre que alterar o código:

```bash
cd frontend
npm run cap:sync    # rebuild + sync para Android
npx cap open android  # abre Android Studio para gerar novo APK
```

---

## Estrutura de pastas após adicionar Android

```
frontend/
├── android/                    ← Projeto Android (gerado pelo Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/         ← Seu build do React vai aqui
│   │   │   └── res/
│   │   │       ├── drawable/   ← Ícones e splash
│   │   │       └── values/     ← Cores, strings
│   │   └── build.gradle
│   └── build.gradle
├── dist/                       ← Build do React (npm run build)
├── src/                        ← Código React
├── capacitor.config.ts         ← Config do Capacitor
└── package.json
```

---

## Personalizar ícone e splash

Instale o plugin de assets:
```bash
npm install @capacitor/assets --save-dev
```

Coloque suas imagens em `assets/`:
- `assets/icon.png` — 1024x1024px, fundo sólido
- `assets/splash.png` — 2732x2732px

Gere todos os tamanhos automaticamente:
```bash
npx capacitor-assets generate --android
```

---

## Dicas para TireMax ERP no mobile

- **Rede**: celular e servidor devem estar na mesma rede Wi-Fi
- **Backend**: certifique-se que a porta 3001 está acessível externamente
- **HTTPS em produção**: obrigatório para publicar na Play Store
- **Tela cheia**: configurado no `capacitor.config.ts` (splashImmersive)
- **Dark mode**: já configurado nativamente pela StatusBar
