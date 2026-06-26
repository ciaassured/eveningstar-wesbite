import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\+-#*';
const finalTitle = 'Evening Star';
const minimumLoaderMs = 3000;

type LoadingScreenProps = {
  ready: boolean;
};

function characterTokens(text: string) {
  const seen = new Map<string, number>();

  return Array.from(text).map((character, index) => {
    const count = seen.get(character) ?? 0;
    seen.set(character, count + 1);

    return {
      character,
      index,
      key: `${character}-${count}`
    };
  });
}

export function LoadingScreen({ ready }: LoadingScreenProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayTitle, setDisplayTitle] = useState(finalTitle);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);

  const titleCharacters = useMemo(() => characterTokens(displayTitle), [displayTitle]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setMinimumElapsed(true), minimumLoaderMs);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let frame = 0;
    let animationFrame = 0;
    const finalCharacters = Array.from(finalTitle);

    const tick = () => {
      frame += 1;
      setDisplayTitle(
        finalCharacters
          .map((character, index) => {
            if (character === ' ') {
              return ' ';
            }

            const settleFrame = 12 + index * 5;
            if (frame > settleFrame) {
              return character;
            }

            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join('')
      );

      if (frame < 80) {
        animationFrame = window.requestAnimationFrame(tick);
      } else {
        setDisplayTitle(finalTitle);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!ready || !minimumElapsed) {
      return;
    }

    const timeout = window.setTimeout(() => setHidden(true), prefersReducedMotion ? 150 : 650);
    return () => window.clearTimeout(timeout);
  }, [minimumElapsed, prefersReducedMotion, ready]);

  return (
    <div aria-hidden={hidden} className={`loader ${hidden ? 'loader--hidden' : ''}`}>
      <div className="loader__brand">CIA</div>
      <div className="loader__title" aria-hidden="true">
        {titleCharacters.map(({ character, index, key }) => (
          <span key={key} style={{ '--loader-index': index } as CSSProperties}>
            {character === ' ' ? '\u00a0' : character}
          </span>
        ))}
      </div>
      <div className="loader__signal" />
    </div>
  );
}
