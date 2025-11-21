// Script de diagnostic pour les problèmes de caméra QR Code
// À coller dans la console du navigateur pour déboguer

console.log('🔍 Diagnostic caméra QR Code');
console.log('===========================');

// 1. Vérifier HTTPS
console.log('1. HTTPS:', window.location.protocol === 'https:' ? '✅' : '❌');
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  console.error('❌ HTTPS requis pour l\'accès caméra en production');
}

// 2. Vérifier l'API MediaDevices
console.log('2. MediaDevices API:', !!navigator.mediaDevices ? '✅' : '❌');
console.log('   getUserMedia:', !!navigator.mediaDevices?.getUserMedia ? '✅' : '❌');

// 3. Tester l'accès caméra
async function testCamera() {
  console.log('3. Test accès caméra...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('✅ Accès caméra accordé');
    stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('❌ Accès caméra refusé:', error.name);
    if (error.name === 'NotAllowedError') {
      console.error('   → Autorisation refusée par l\'utilisateur');
    } else if (error.name === 'NotFoundError') {
      console.error('   → Aucune caméra détectée');
    } else if (error.name === 'NotSupportedError') {
      console.error('   → API non supportée');
    }
  }
}

// 4. Vérifier les permissions
async function checkPermissions() {
  console.log('4. Vérification permissions...');
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    console.log('✅ Permission caméra:', result.state);
    if (result.state === 'denied') {
      console.error('❌ Permission refusée - Vérifier les paramètres du navigateur');
    }
  } catch (error) {
    console.log('⚠️ API Permissions non supportée (fallback utilisé)');
  }
}

// 5. Lister les appareils
async function listDevices() {
  console.log('5. Appareils caméra disponibles...');
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    console.log(`✅ ${cameras.length} caméra(s) détectée(s):`);
    cameras.forEach((camera, index) => {
      console.log(`   ${index + 1}. ${camera.label || 'Caméra ' + (index + 1)}`);
    });
    if (cameras.length === 0) {
      console.error('❌ Aucune caméra détectée');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'énumération:', error);
  }
}

// Exécuter les tests
testCamera();
checkPermissions();
listDevices();

console.log('===========================');
console.log('📋 Résolutions possibles:');
console.log('• Vérifier que le site utilise HTTPS');
console.log('• Autoriser l\'accès caméra dans les paramètres');
console.log('• Actualiser la page après avoir accordé les permissions');
console.log('• Tester sur un autre navigateur');
console.log('• Vérifier que l\'appareil a une caméra fonctionnelle');
