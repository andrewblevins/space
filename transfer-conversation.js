/**
 * SPACE Terminal Conversation Transfer Utility
 * 
 * Run this in browser console to export/import conversation data
 */

// EXPORT: Run this on your live site
function exportSpaceData() {
  const exportData = {};
  
  // Get all localStorage keys that start with 'space_'
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
  
  // Also copy to clipboard if possible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      .then(() => console.log('✅ Data also copied to clipboard!'))
      .catch(() => console.log('⚠️  Clipboard copy failed, please copy manually'));
  }
  
  return exportData;
}

// IMPORT: Run this on your local dev server
function importSpaceData(importedData) {
  if (typeof importedData === 'string') {
    try {
      importedData = JSON.parse(importedData);
    } catch (error) {
      console.error('❌ Invalid JSON data:', error);
      return;
    }
  }
  
  if (!importedData || typeof importedData !== 'object') {
    console.error('❌ Import data must be an object');
    return;
  }
  
  let importedCount = 0;
  let skippedCount = 0;
  
  console.log('🔄 Starting import...');
  
  Object.keys(importedData).forEach(key => {
    if (key.startsWith('space_')) {
      try {
        const existingValue = localStorage.getItem(key);
        if (existingValue) {
          console.log(`⚠️  Key ${key} already exists, overwriting...`);
        }
        
        localStorage.setItem(key, importedData[key]);
        importedCount++;
        console.log(`✅ Imported: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to import ${key}:`, error);
        skippedCount++;
      }
    } else {
      console.log(`⏭️  Skipped non-SPACE key: ${key}`);
      skippedCount++;
    }
  });
  
  console.log('=====================================');
  console.log(`✅ Import complete! Imported ${importedCount} keys, skipped ${skippedCount}`);
  console.log('🔄 Refresh the page to see your transferred data');
  console.log('=====================================');
}

// CLEANUP: Remove all SPACE data (use with caution!)
function cleanupSpaceData() {
  if (!confirm('⚠️  This will DELETE ALL SPACE data in localStorage. Are you sure?')) {
    return;
  }
  
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('space_')) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️  Deleted: ${key}`);
  });
  
  console.log(`✅ Deleted ${keysToDelete.length} SPACE keys`);
}

// Show help
console.log(`
🚀 SPACE Terminal Conversation Transfer

STEP 1: On your LIVE site, run:
  exportSpaceData()

STEP 2: Copy the JSON output

STEP 3: On your LOCAL dev server, run:
  importSpaceData(/* paste JSON here */)

Optional: Clean up data with:
  cleanupSpaceData()
`);