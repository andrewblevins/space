const exportData = {};

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('space_')) {
    try {
      exportData[key] = localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to export key ${key}:`, error);
    }
  }
}

console.log('📦 SPACE data exported! Copy the JSON below:');
console.log('=====================================');
console.log(JSON.stringify(exportData, null, 2));
console.log('=====================================');
console.log(`Found ${Object.keys(exportData).length} SPACE keys to transfer`);

if (navigator.clipboard) {
  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    .then(() => console.log('✅ Data also copied to clipboard!'))
    .catch(() => console.log('⚠️ Clipboard copy failed, please copy manually'));
}