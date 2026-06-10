# ios-res/Podfile_config.rb
# ===========================
# INSTRUÇÕES: Após rodar "npx cap add ios", abra:
# ios/App/Podfile
#
# Certifique-se que a primeira linha define a versão mínima do iOS:
# (Capacitor 6 requer iOS 13+)

# platform :ios, '13.0'  ← já deve estar definido pelo Capacitor

# Se precisar adicionar pods extras (ex: Firebase para Push):
# target 'App' do
#   capacitor_pods
#
#   # Push Notifications via Firebase (opcional)
#   # pod 'Firebase/Messaging'
#
#   # Biometria (opcional)
#   # pod 'LocalAuthentication'
# end

# Resolução de problemas comuns no iOS:
# 1. "pod install" falhou → rode: sudo gem install cocoapods
# 2. Simulador não abre → Xcode > Preferences > Locations > Command Line Tools
# 3. "No signing certificate" → Xcode > Signing & Capabilities > Team
