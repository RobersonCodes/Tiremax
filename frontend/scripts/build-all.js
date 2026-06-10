#!/usr/bin/env node
/**
 * scripts/build-all.js
 * Script utilitário para automação de builds.
 * Uso: node scripts/build-all.js [android|ios|all]
 */

const { execSync } = require('child_process')
const platform = process.argv[2] || 'all'

const run = (cmd, label) => {
  console.log(`\n⚡ ${label}...`)
  try {
    execSync(cmd, { stdio: 'inherit' })
    console.log(`✅ ${label} concluído`)
  } catch (err) {
    console.error(`❌ Erro em: ${label}`)
    process.exit(1)
  }
}

const log = (msg) => console.log(`\n${'─'.repeat(50)}\n${msg}\n${'─'.repeat(50)}`)

async function main() {
  log(`🚀 TireMax ERP — Build para: ${platform.toUpperCase()}`)

  // 1. Build React
  run('npm run build', 'Build React (Vite)')

  if (platform === 'android' || platform === 'all') {
    log('📱 Android')
    run('npx cap sync android', 'Sync Android')
    console.log('\n📋 Próximos passos para Android:')
    console.log('   npx cap open android')
    console.log('   Build → Build APK(s) no Android Studio\n')
  }

  if (platform === 'ios' || platform === 'all') {
    log('🍎 iOS')
    run('npx cap sync ios', 'Sync iOS')
    console.log('\n📋 Próximos passos para iOS:')
    console.log('   npx cap open ios')
    console.log('   Product → Archive no Xcode\n')
  }

  log('✅ Build finalizado!')

  if (platform === 'all') {
    console.log('📱 Android APK: npx cap open android → Build → Build APK(s)')
    console.log('🍎 iOS IPA:     npx cap open ios → Product → Archive')
  }
}

main()
