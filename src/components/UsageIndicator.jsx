import { useUsageTracking } from '../hooks/useUsageTracking';

export default function UsageIndicator() {
  const { usage, loading, isEnabled } = useUsageTracking();

  // Don't show if auth is disabled or still loading
  if (!isEnabled || loading || !usage) return null;

  const percentage = (usage.usage / usage.limit) * 100;
  const isApproachingLimit = percentage >= 80;
  const isNearLimit = percentage >= 90;

  return (
    <div className={`text-sm px-3 py-2 rounded-lg ${
      isNearLimit ? 'bg-red-900 text-red-400 border border-red-600' :
      isApproachingLimit ? 'bg-yellow-900 text-yellow-400 border border-yellow-600' :
      'bg-gray-800 text-gray-400 border border-gray-600'
    }`}>
      <div className="flex justify-between items-center">
        <span className="font-medium">Messages Today</span>
        <span className="font-bold">{usage.usage}/{usage.limit}</span>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isNearLimit ? 'bg-red-500' :
            isApproachingLimit ? 'bg-yellow-500' :
            'bg-orange-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isApproachingLimit && (
        <div className="text-xs mt-2 opacity-80">
          {isNearLimit ? 'Approaching daily limit' : `${usage.remaining} messages remaining`}
        </div>
      )}
    </div>
  );
}