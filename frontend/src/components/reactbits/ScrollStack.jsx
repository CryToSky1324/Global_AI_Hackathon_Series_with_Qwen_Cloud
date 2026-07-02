import React, { useCallback, useLayoutEffect, useRef } from 'react';

export const ScrollStackItem = ({ children, itemClassName = '' }) => (
  <div className={('scroll-stack-card ' + itemClassName).trim()}>{children}</div>
);

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function ScrollStack({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = true,
  onStackComplete,
}) {
  const scrollerRef = useRef(null);
  const cardsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const stackCompletedRef = useRef(false);

  const parseDistance = useCallback((value, height) => {
    if (typeof value === 'string' && value.includes('%')) return (parseFloat(value) / 100) * height;
    return parseFloat(value);
  }, []);

  const updateCardTransforms = useCallback(() => {
    const scroller = scrollerRef.current;
    const cards = cardsRef.current;
    if (!scroller || !cards.length) return;

    const viewportHeight = useWindowScroll ? window.innerHeight : scroller.clientHeight;
    const stackPin = parseDistance(stackPosition, viewportHeight);
    const rect = scroller.getBoundingClientRect();
    const scrollerTop = useWindowScroll ? rect.top + window.scrollY : scroller.offsetTop;
    const scrollTop = useWindowScroll ? window.scrollY : scroller.scrollTop;
    const localScroll = clamp(scrollTop - scrollerTop, 0, Math.max(scroller.offsetHeight - viewportHeight, 1));
    const totalTravel = Math.max(itemDistance * cards.length, 1);
    const completed = localScroll >= totalTravel - itemDistance * 0.06;

    cards.forEach((card, index) => {
      const cardStart = index * itemDistance;
      const progress = clamp((localScroll - cardStart) / itemDistance);
      const pinProgress = clamp(localScroll / Math.max(totalTravel, 1));
      const targetScale = baseScale + index * itemScale;
      const scale = 1 - progress * (1 - targetScale);
      const rotation = rotationAmount ? index * rotationAmount * progress : 0;
      const naturalOffset = Math.max(cardStart - localScroll, 0);
      const stackedOffset = itemStackDistance * index;
      const translateY = stackPin + naturalOffset + stackedOffset * progress;
      const topIndex = Math.floor(clamp(localScroll / itemDistance, 0, cards.length - 1));
      const blur = blurAmount && index < topIndex ? (topIndex - index) * blurAmount : 0;
      const opacity = index > topIndex + 1 ? 0.1 + pinProgress * 0.4 : 1;

      card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`;
      card.style.filter = blur > 0 ? `blur(${blur}px)` : '';
      card.style.opacity = String(opacity);
      card.style.zIndex = String(cards.length + index);
    });

    if (completed && !stackCompletedRef.current) {
      stackCompletedRef.current = true;
      onStackComplete?.();
    } else if (!completed && stackCompletedRef.current) {
      stackCompletedRef.current = false;
    }
  }, [baseScale, blurAmount, itemDistance, itemScale, itemStackDistance, onStackComplete, parseDistance, rotationAmount, stackPosition, useWindowScroll]);

  useLayoutEffect(() => {
    const root = scrollerRef.current;
    if (!root) return undefined;
    const cards = Array.from(root.querySelectorAll('.scroll-stack-card'));
    cardsRef.current = cards;

    const viewportHeight = window.innerHeight || 900;
    const scrollHeight = Math.max(viewportHeight + itemDistance * (cards.length + 1.05), viewportHeight * 2.05);
    root.style.setProperty('--scroll-stack-height', `${scrollHeight}px`);

    cards.forEach((card) => {
      card.style.willChange = 'transform, filter, opacity';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.perspective = '1000px';
    });

    const requestUpdate = () => {
      if (animationFrameRef.current) return;
      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        updateCardTransforms();
      });
    };

    const resize = () => {
      const nextHeight = Math.max(window.innerHeight + itemDistance * (cards.length + 1.05), window.innerHeight * 2.05);
      root.style.setProperty('--scroll-stack-height', `${nextHeight}px`);
      requestUpdate();
    };

    updateCardTransforms();
    const scrollTarget = useWindowScroll ? window : root;
    scrollTarget.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', resize);

    return () => {
      scrollTarget.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      cardsRef.current = [];
    };
  }, [itemDistance, updateCardTransforms, useWindowScroll]);

  return (
    <div className={('scroll-stack-scroller ' + className).trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
      </div>
      <div className="scroll-stack-end" />
    </div>
  );
}
