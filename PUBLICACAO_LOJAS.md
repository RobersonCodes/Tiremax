# 🚀 TireMax ERP — Guia de Publicação
## Play Store (Android) + App Store (iOS)

---

## 📋 Checklist Pré-Publicação

Antes de começar, confirme cada item:

- [ ] Backend rodando em HTTPS (obrigatório para ambas as lojas)
- [ ] Domínio com SSL/TLS válido (ex: api.tiremax.com.br)
- [ ] `VITE_API_URL` apontando para o servidor de produção
- [ ] `webContentsDebuggingEnabled: false` no capacitor.config.ts
- [ ] `loggingBehavior: 'none'` no capacitor.config.ts
- [ ] Ícone do app 1024x1024px (fundo sólido, sem transparência)
- [ ] Splash screen 2732x2732px
- [ ] Screenshots do app (mínimo 2 por plataforma)
- [ ] Texto de descrição do app preparado
- [ ] Política de Privacidade publicada em URL acessível

---

## 🔧 Passo 1 — Configurar produção no frontend

### 1.1 Crie o `.env.production`

```bash
# frontend/.env.production
VITE_API_URL=https://api.seudominio.com.br
```

### 1.2 Atualize `capacitor.config.ts` para produção

```typescript
const config: CapacitorConfig = {
  appId: 'com.tiremax.erp',
  appName: 'TireMax ERP',
  webDir: 'dist',
  // NÃO deve ter a chave "server" em produção
  android: {
    allowMixedContent: false,        // false obrigatório (HTTPS)
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none',
    backgroundColor: '#0a0c14',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0c14',
  },
  // ... plugins
}
```

### 1.3 Build de produção

```bash
cd frontend
npm run build
# Confirme que dist/ foi gerado sem erros
```

---

## 🎨 Passo 2 — Gerar ícones e splash screen

### Instale o gerador automático

```bash
cd frontend
npm install @capacitor/assets --save-dev
```

### Prepare as imagens base

Crie a pasta `assets/` dentro de `frontend/`:

```
frontend/
└── assets/
    ├── icon.png          ← 1024x1024px, PNG, SEM transparência, fundo sólido
    ├── icon-foreground.png  ← 1024x1024px, apenas o símbolo (para Android adaptive icon)
    ├── icon-background.png  ← 1024x1024px, apenas o fundo
    └── splash.png        ← 2732x2732px, PNG, logo centralizado
```

**Dicas para o ícone do TireMax:**
- Fundo: `#0a0c14` (dark) ou `#3b64ff` (azul brand)
- Símbolo: logotipo da empresa ou ícone de pneu estilizado
- Sem cantos arredondados (o sistema operacional arredonda automaticamente)
- Sem transparência no PNG

### Gere todos os tamanhos automaticamente

```bash
cd frontend
npx capacitor-assets generate --android
npx capacitor-assets generate --ios
```

Isso gera automaticamente todos os tamanhos necessários:
- Android: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi + adaptive icons
- iOS: todos os tamanhos do AppIcon.appiconset

---

## 📱 Passo 3 — Android (Play Store)

### 3.1 Adicione a plataforma (se ainda não fez)

```bash
cd frontend
npx cap add android
npx cap sync android
```

### 3.2 Copie os arquivos de configuração

```bash
# Copie os arquivos da pasta android-res/ para o projeto Android
cp android-res/strings.xml android/app/src/main/res/values/strings.xml
cp android-res/colors.xml android/app/src/main/res/values/colors.xml
cp android-res/styles.xml android/app/src/main/res/values/styles.xml
mkdir -p android/app/src/main/res/xml
cp android-res/network_security_config.xml android/app/src/main/res/xml/network_security_config.xml
```

### 3.3 Atualize o AndroidManifest.xml

Abra `android/app/src/main/AndroidManifest.xml` e:

1. Adicione as permissões (veja `android-res/AndroidManifest_permissions.xml`)
2. Na tag `<application>` adicione:
```xml
android:networkSecurityConfig="@xml/network_security_config"
android:usesCleartextTraffic="false"
```

### 3.4 Defina a versão do app

Edite `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.tiremax.erp"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1         // incrementar a cada atualização
        versionName "1.0.0"  // versão visível ao usuário
    }
}
```

### 3.5 Crie a Keystore de assinatura (UMA ÚNICA VEZ)

```bash
# Execute na raiz do projeto — GUARDE ESTE ARQUIVO COM SEGURANÇA!
keytool -genkey -v \
  -keystore tiremax-release.keystore \
  -alias tiremax \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Vai pedir:
# - Senha da keystore (anote!)
# - Nome, organização, cidade, estado, país
# - Confirmar senha
```

⚠️ **CRÍTICO:** Faça backup da keystore. Se perder, não consegue atualizar o app na Play Store NUNCA mais.

### 3.6 Configure a assinatura no build.gradle

Edite `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../../tiremax-release.keystore')
            storePassword 'sua_senha_aqui'
            keyAlias 'tiremax'
            keyPassword 'sua_senha_aqui'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Alternativa mais segura** — usar variáveis de ambiente:

```gradle
signingConfigs {
    release {
        storeFile file(System.getenv("KEYSTORE_PATH") ?: '../../../tiremax-release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: ''
        keyAlias System.getenv("KEY_ALIAS") ?: 'tiremax'
        keyPassword System.getenv("KEY_PASSWORD") ?: ''
    }
}
```

### 3.7 Gere o AAB (Android App Bundle) — requerido pela Play Store

```bash
cd android
./gradlew bundleRelease
```

Arquivo gerado: `android/app/build/outputs/bundle/release/app-release.aab`

Ou pelo Android Studio:
- **Build → Generate Signed Bundle / APK**
- Selecione **Android App Bundle**
- Selecione sua keystore
- Escolha **release**

### 3.8 Publique na Play Store

1. Acesse: https://play.google.com/console
2. **Criar app** → preencha nome, idioma, tipo (app), gratuito/pago
3. **Configuração** → preencha todos os campos obrigatórios:
   - Presença na Play Store (descrição curta, longa, screenshots)
   - Classificação de conteúdo (responda o questionário)
   - Política de privacidade (URL obrigatória)
   - Acesso ao app (login necessário? informe as credenciais de teste)
4. **Versões → Produção → Criar nova versão**
5. Faça upload do `.aab`
6. Adicione notas da versão
7. **Enviar para revisão**

⏱️ Revisão: 1–3 dias úteis na primeira publicação.

---

## 🍎 Passo 4 — iOS (App Store)

> **Requisito:** Mac com macOS 13+ e Xcode 15+

### 4.1 Adicione a plataforma

```bash
cd frontend
npx cap add ios
npx cap sync ios
```

### 4.2 Instale as dependências iOS

```bash
cd ios/App
pod install
cd ../..
```

### 4.3 Abra no Xcode

```bash
npx cap open ios
```

### 4.4 Configure o projeto no Xcode

No painel esquerdo, clique em **App** (ícone azul) → aba **Signing & Capabilities**:

- **Team**: selecione sua conta Apple Developer
- **Bundle Identifier**: `com.tiremax.erp`
- **Automatically manage signing**: ✅ ativado (para começar)

### 4.5 Adicione as permissões no Info.plist

Abra `ios/App/App/Info.plist` e adicione as chaves do arquivo `ios-res/Info_plist_additions.xml`.

No Xcode, você pode editar visualmente:
- **App** → **Info** → adicione as chaves de permissão

### 4.6 Configure a versão

No Xcode → **App** → **General**:
- **Version**: `1.0.0` (visível ao usuário)
- **Build**: `1` (incrementar a cada upload)

### 4.7 Crie o Archive (build de produção)

No Xcode:
1. Selecione **Any iOS Device (arm64)** no seletor de destino (não um simulador)
2. Menu: **Product → Archive**
3. Aguarde o processo (pode demorar 5–15 minutos)

### 4.8 Distribua via Xcode Organizer

Após o Archive:
1. Xcode abre o **Organizer** automaticamente
2. Selecione o archive criado
3. Clique em **Distribute App**
4. Escolha **App Store Connect**
5. Escolha **Upload**
6. Siga os passos (validação automática)
7. Clique em **Upload**

### 4.9 Publique na App Store Connect

1. Acesse: https://appstoreconnect.apple.com
2. **Meus Apps → +** → Novo App
   - Plataforma: iOS
   - Nome: TireMax ERP
   - Idioma principal: Português (Brasil)
   - Bundle ID: com.tiremax.erp
   - SKU: tiremax-erp-001
3. Preencha **Informações do App**:
   - Descrição (máx 4.000 caracteres)
   - Palavras-chave (100 caracteres)
   - URL de suporte
   - URL de política de privacidade ← **obrigatório**
4. **Screenshots** (obrigatório):
   - iPhone 6.5" (1242 × 2688px) — mínimo 2
   - iPhone 5.5" (1242 × 2208px) — mínimo 2
   - iPad Pro 12.9" (se suportar iPad)
5. **Build** → selecione o build que você fez upload
6. **Informações de revisão**:
   - Se o app precisa de login, forneça: `admin@tiremax.com` / `admin123`
   - Notas para o revisor: explique o que o app faz
7. Clique em **Enviar para Revisão**

⏱️ Revisão Apple: 1–7 dias úteis (média 24–48h atualmente).

---

## 📸 Passo 5 — Screenshots para as lojas

### Como capturar screenshots de qualidade

**Android — no Android Studio:**
```
Emulator → Device → Screenshot (ícone de câmera)
Resoluções recomendadas:
- Telefone: 1080 × 1920px ou maior
- Tablet 7": 1200 × 1920px
- Tablet 10": 1920 × 1200px
```

**iOS — no Xcode Simulator:**
```
Simulator → File → Take Screenshot (⌘S)
Resoluções obrigatórias:
- iPhone 6.5": 1242 × 2688px (iPhone 11 Pro Max / 14 Plus)
- iPhone 5.5": 1242 × 2208px (iPhone 8 Plus)
```

### Telas recomendadas para capturar

1. **Login** — tela inicial com logo
2. **Dashboard** — métricas e gráfico
3. **PDV** — carrinho com produtos
4. **Ordem de Serviço** — lista de OS
5. **Estoque** — tabela de produtos

---

## 🔒 Passo 6 — Política de Privacidade (obrigatório)

Ambas as lojas **exigem** uma URL de política de privacidade.

Crie uma página simples (pode ser no GitHub Pages, Notion, Google Sites) com:

```
POLÍTICA DE PRIVACIDADE — TireMax ERP

Última atualização: [data]

1. DADOS COLETADOS
   O TireMax ERP coleta dados de uso comercial como:
   clientes, veículos, produtos, vendas e serviços,
   inseridos pelo próprio usuário do sistema.

2. USO DOS DADOS
   Os dados são utilizados exclusivamente para gestão
   interna da empresa. Não compartilhamos dados com
   terceiros.

3. ARMAZENAMENTO
   Os dados são armazenados no servidor próprio da empresa,
   configurado pelo administrador do sistema.

4. CONTATO
   [seu email de contato]
```

---

## 📊 Passo 7 — Versões e atualizações futuras

### Para publicar uma atualização:

```bash
# 1. Atualize o código
# 2. Incremente a versão

# Android — edite android/app/build.gradle:
versionCode 2        # +1 sempre
versionName "1.0.1"

# iOS — no Xcode, General:
Version: 1.0.1
Build: 2            # +1 sempre

# 3. Rebuild e sync
cd frontend
npm run build
npx cap sync

# 4. Gere novo AAB (Android) e Archive (iOS)
# 5. Faça upload nas respectivas consoles
```

---

## ⚡ Resumo dos comandos

```bash
# ── Build completo para ambas as plataformas ──────────────────
cd frontend
npm run build
npx cap sync

# ── Android ──────────────────────────────────────────────────
npx cap open android
# Android Studio: Build → Generate Signed Bundle → .aab
# Play Console: upload do .aab

# ── iOS ──────────────────────────────────────────────────────
npx cap open ios
# Xcode: Product → Archive → Distribute → App Store Connect
# App Store Connect: selecionar build e enviar para revisão
```

---

## 🆘 Problemas mais comuns

| Problema | Solução |
|---------|---------|
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Desinstale a versão de debug antes de instalar o release |
| `App Transport Security` (iOS) | Backend precisa de HTTPS com certificado válido |
| `allowMixedContent` warning | Confirme que `VITE_API_URL` usa `https://` |
| Keystore perdida | Impossível atualizar o app. NUNCA perca o arquivo |
| Revisão rejeitada (login necessário) | Forneça usuário de teste nas notas de revisão |
| Screenshots recusadas | Use simulador/emulador, não print de desktop |
| `pod install` falhou | `sudo gem install cocoapods && pod repo update` |

---

## 💰 Custos

| | Play Store | App Store |
|--|--|--|
| Taxa | **US$ 25** (única vez) | **US$ 99/ano** |
| Revisão | 1–3 dias | 1–7 dias |
| Rejeições | Raras | Mais frequentes |
| Conta | Google Developer | Apple Developer Program |
| Link | play.google.com/console | developer.apple.com |
