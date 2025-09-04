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
          console.log(`⚠️ Key ${key} already exists, overwriting...`);
        }
        
        localStorage.setItem(key, importedData[key]);
        importedCount++;
        console.log(`✅ Imported: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to import ${key}:`, error);
        skippedCount++;
      }
    } else {
      console.log(`⏭️ Skipped non-SPACE key: ${key}`);
      skippedCount++;
    }
  });
  
  console.log('=====================================');
  console.log(`✅ Import complete! Imported ${importedCount} keys, skipped ${skippedCount}`);
  console.log('🔄 Refresh the page to see your transferred data');
  console.log('=====================================');
}

// Paste your exported JSON data here and call:
// importSpaceData(YOUR_EXPORTED_DATA_HERE);