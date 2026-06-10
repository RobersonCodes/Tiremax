# 🍎 Guia — Gerar IPA iOS com Capacitor

## Pré-requisitos

| Ferramenta | Requisito |
|------------|-----------|
| Mac com macOS 13+ | Obrigatório |
| Xcode 15+ | App Store |
| Apple Developer Account | US$ 99/ano |
| CocoaPods | `sudo gem install cocoapods` |

---

## Passo a passo

### 1. Adicione a plataforma iOS

```bash
cd frontend
npm install
npx cap add ios
```

### 2. Build e sync

```bash
npm run cap:ios
# Equivale a: npm run build && cap sync ios && cap open ios
```

### 3. No Xcode

1. Selecione seu **Team** em Signing & Capabilities
2. Defina o Bundle ID: `com.tiremax.erp`
3. Conecte o iPhone via USB
4. Clique em **▶ Run** para instalar direto no celular

### 4. Gerar IPA para distribuição

- **TestFlight**: Archive → Distribute → App Store Connect
- **Ad Hoc**: Archive → Distribute → Ad Hoc (para distribuição interna)

---

## Safe Area (iPhone com notch)

Já configurado no `AppLayout.jsx` com `env(safe-area-inset-bottom)`.

Para garantir, adicione ao `index.html`:
```html
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0">
```

---

## Publicar na App Store

1. Archive o projeto no Xcode
2. Acesse https://appstoreconnect.apple.com
3. Faça upload via Xcode Organizer
4. Preencha metadados e envie para revisão (1-3 dias úteis)
