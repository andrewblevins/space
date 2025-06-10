/**
 * Comprehensive advisor color palette
 * Organized by light spectrum order (ROYGBIV + extensions)
 */
export const ADVISOR_COLORS = [
  // Red spectrum
  'bg-red-800',
  'bg-red-500',
  'bg-rose-500',
  
  // Orange spectrum  
  'bg-orange-500',
  'bg-amber-600',
  
  // Yellow spectrum
  'bg-yellow-500',
  'bg-lime-600',
  
  // Green spectrum
  'bg-emerald-600',
  
  // Blue-Green spectrum
  'bg-teal-600',
  'bg-cyan-500',
  
  // Blue spectrum
  'bg-sky-500',
  'bg-blue-500',
  
  // Indigo spectrum
  'bg-indigo-600',
  
  // Violet/Purple spectrum
  'bg-violet-600',
  'bg-purple-600',
  'bg-fuchsia-600',
  'bg-pink-500',
  
  // Neutral/Earth colors
  'bg-slate-600',
  'bg-stone-600',
  'bg-amber-800',
  'bg-white',
  'bg-black'
];

/**
 * Get the next available color for a new advisor
 * @param {Array} existingAdvisors - Array of existing advisors OR array of color strings
 * @returns {string} Next available color class
 */
export const getNextAvailableColor = (existingAdvisors) => {
  // Handle both array of advisors and array of color strings
  const usedColors = Array.isArray(existingAdvisors)
    ? existingAdvisors
        .map(item => typeof item === 'string' ? item : item.color)
        .filter(Boolean) // Filter out null/undefined colors
    : [];
  
  // Find first unused color, or cycle back to start if all are used
  const nextColor = ADVISOR_COLORS.find(color => !usedColors.includes(color));
  return nextColor || ADVISOR_COLORS[usedColors.length % ADVISOR_COLORS.length];
};

/**
 * Get color display name for UI
 * @param {string} colorClass - Tailwind color class (e.g., 'bg-red-500')
 * @returns {string} Human-readable color name
 */
export const getColorDisplayName = (colorClass) => {
  const colorMap = {
    // Red spectrum
    'bg-red-800': 'Dark Red',
    'bg-red-500': 'Red',
    'bg-rose-500': 'Rose',
    
    // Orange spectrum
    'bg-orange-500': 'Orange',
    'bg-amber-600': 'Amber',
    
    // Yellow spectrum
    'bg-yellow-500': 'Yellow',
    'bg-lime-600': 'Lime',
    
    // Green spectrum
    'bg-emerald-600': 'Emerald',
    
    // Blue-Green spectrum
    'bg-teal-600': 'Teal',
    'bg-cyan-500': 'Cyan',
    
    // Blue spectrum
    'bg-sky-500': 'Sky',
    'bg-blue-500': 'Blue',
    
    // Indigo spectrum
    'bg-indigo-600': 'Indigo',
    
    // Violet/Purple spectrum
    'bg-violet-600': 'Violet',
    'bg-purple-600': 'Purple',
    'bg-fuchsia-600': 'Fuchsia',
    'bg-pink-500': 'Pink',
    
    // Neutral/Earth colors
    'bg-slate-600': 'Slate',
    'bg-stone-600': 'Stone',
    'bg-amber-800': 'Brown'
  };
  return colorMap[colorClass] || 'Unknown';
};