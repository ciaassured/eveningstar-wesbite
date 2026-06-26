import type { CSSProperties, ElementType, HTMLAttributes } from 'react';
import { createElement } from 'react';

type KineticTextProps = {
  as?: ElementType;
  text: string;
  className?: string;
  outline?: boolean;
} & HTMLAttributes<HTMLElement>;

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

export function KineticText({ as, text, className, outline = false, ...props }: KineticTextProps) {
  const Tag = as ?? 'span';
  const classes = ['kinetic-text', outline ? 'kinetic-text--outline' : '', className ?? ''].filter(Boolean).join(' ');
  const tokens = characterTokens(text);

  return createElement(
    Tag,
    { className: classes, ...props },
    tokens.map(({ character, index, key }) => (
      <span className="kinetic-text__char" key={key} style={{ '--char-index': index } as CSSProperties}>
        {character === ' ' ? '\u00a0' : character}
      </span>
    ))
  );
}
