import type { ReactNode } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)}\]'"])/g;

export const Linkify = ({ children, className }: { children: string; className?: string }) => {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(URL_REGEX.source, 'g');
  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <span className={className}>{children}</span>;
  }

  return <span className={className}>{parts}</span>;
};
