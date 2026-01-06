import React from 'react';

const VotingSummary = ({ voteHistory }) => {
  if (!voteHistory || voteHistory.length === 0) return null;

  const currentVote = voteHistory[voteHistory.length - 1];
  const { question, votes } = currentVote;

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
    <div className="mt-2 p-3 border border-orange-500/20 rounded bg-gray-900/20 text-sm">
      <div className="mb-2 text-orange-300 font-medium text-xs">
        Latest Vote: "{question}"
      </div>
      
      {/* Individual advisor votes */}
      <div className="mb-3 space-y-1">
        {votes.map((vote, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-gray-300 truncate">{vote.advisor}</span>
            <span className="text-gray-400">{vote.position} ({vote.confidence}%)</span>
          </div>
        ))}
      </div>

      {/* Tally bars */}
      {Object.entries(tally).map(([pos, count]) => (
        <div key={pos} className="flex items-center mb-1">
          <div className="w-1/4 text-gray-400 text-xs">{pos}</div>
          <div className="w-3/4 bg-gray-700 rounded h-2 mr-2">
            <div
              className="bg-orange-500 h-2 rounded"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">{count}</div>
        </div>
      ))}
      
      <div className="mt-2 text-orange-400 font-medium">
        {`${tally[recommended]}/${total} advisors recommend ${recommended} (confidence: ${avgConfidence}%)`}
      </div>
      
      {voteHistory.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          {voteHistory.length} total votes conducted
        </div>
      )}
    </div>
  );
};

export default VotingSummary;
