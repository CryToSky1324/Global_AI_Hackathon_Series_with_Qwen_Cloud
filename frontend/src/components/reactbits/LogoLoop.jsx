import React from 'react';
import './LogoLoop.css';

export default function LogoLoop({
  items,
  speed = 34,
  ariaLabel = 'Technology stack carousel',
}) {
  const loopItems = [...items, ...items];

  return (
    <div className="rb-logo-loop rb-logo-loop-fade" style={{ '--rb-logo-duration': `${speed}s` }} aria-label={ariaLabel}>
      <div className="rb-logo-loop-track">
        {loopItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div className="rb-logo-loop-item" key={`${item.name}-${index}`} aria-hidden={index >= items.length}>
              <span className="rb-logo-loop-pill">
                <span className={`rb-logo-loop-icon ${item.tone || ''}`.trim()}>
                  {Icon ? <Icon aria-hidden="true" /> : item.mark}
                </span>
                <span>{item.name}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
