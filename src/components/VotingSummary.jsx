import React from 'react';

const VotingSummary = ({ votes }) => {
  if (!votes || votes.length === 0) return null;

  const tally = {};
  let totalConfidence = 0;
  votes.forEach(v => {
    tally[v.position] = (tally[v.position] || 0) + 1;
    totalConfidence += v.confidence;
  });
  const total = votes.length;
  const avgConfidence = Math.round(totalConfidence / total);
  const recommended = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];

  return (
    <div className="mt-2 p-2 border border-green-400/20 rounded bg-gray-900/20 text-sm">
      {Object.entries(tally).map(([pos, count]) => (
        <div key={pos} className="flex items-center mb-1">
          <div className="w-1/4 text-gray-400 text-xs">{pos}</div>
          <div className="w-3/4 bg-gray-700 rounded h-2 mr-2">
            <div
              className="bg-green-500 h-2 rounded"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">{count}</div>
        </div>
      ))}
      <div className="mt-2 text-green-400">
        {`${tally[recommended]}/${total} advisors recommend ${recommended} (confidence: ${avgConfidence}%)`}
      </div>
    </div>
  );
};

export default VotingSummary;
