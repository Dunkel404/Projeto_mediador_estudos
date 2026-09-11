'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = true,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      return `<span class="text-red-400 font-mono">${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <div
      className={`overflow-x-auto text-slate-100 ${displayMode ? 'my-2 text-center' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
