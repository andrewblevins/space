import React from 'react';
import { hueFor, initials, portraitUrl } from './advisorStyle.js';

// The advisor's likeness: their portrait if the folder has one, otherwise a
// carved monogram in a marble niche.
export default function Bust({ advisor, size = 'large' }) {
  const hue = hueFor(advisor.id);
  return (
    <div className={`bust bust-${size}`} style={{ '--hue': hue }}>
      {advisor.portrait ? (
        <img src={portraitUrl(advisor.portrait)} alt="" draggable={false} />
      ) : (
        <span className="monogram">{initials(advisor.name)}</span>
      )}
    </div>
  );
}
