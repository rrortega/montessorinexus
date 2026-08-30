import React from 'react';

interface ParsedTable {
  title?: string;
  headers: string[];
  rows: string[][];
  maxCols: number;
}

export function parseBoxTable(text: string): ParsedTable | null {
  if (!text || typeof text !== 'string') return null;
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  
  const hasBoxChars = /[┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬│─═]/.test(text) || (lines[0].startsWith('+') && lines[lines.length - 1].startsWith('+'));
  if (!hasBoxChars) return null;

  const isSeparator = (line: string) => /^[┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬─═+\-\s|│]+$/.test(line) && !/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(line);
  
  const contentLines = lines.filter(line => !isSeparator(line) && (line.includes('│') || line.includes('|') || line.includes('║')));
  if (contentLines.length === 0) return null;

  const parsedRows = contentLines.map(line => {
    let clean = line;
    if (clean.startsWith('│') || clean.startsWith('|') || clean.startsWith('║')) clean = clean.slice(1);
    if (clean.endsWith('│') || clean.endsWith('|') || clean.endsWith('║')) clean = clean.slice(0, -1);
    return clean.split(/[│|║]/).map(cell => cell.trim());
  });

  let title = '';
  let startIdx = 0;
  
  const maxCols = Math.max(...parsedRows.map(r => r.length));
  if (parsedRows.length > 1 && parsedRows[0].length === 1 && maxCols > 1) {
    title = parsedRows[0][0];
    startIdx = 1;
  }

  const headerRow = parsedRows[startIdx] || [];
  const dataRows = parsedRows.slice(startIdx + 1);

  if (headerRow.length === 0 && dataRows.length === 0) return null;

  return { title, headers: headerRow, rows: dataRows, maxCols };
}

interface AsciiTableRendererProps {
  data: ParsedTable;
  isSaaSBlog?: boolean;
}

export const AsciiTableRenderer: React.FC<AsciiTableRendererProps> = ({ data, isSaaSBlog }) => {
  const { title, headers, rows, maxCols } = data;

  return (
    <div className="my-8 w-full overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xs shadow-xs">
      {title && (
        <div className={`py-3 px-4 sm:px-6 border-b border-border font-display font-bold text-xs sm:text-sm tracking-wide text-center uppercase ${
          isSaaSBlog
            ? 'bg-[#C4661F]/15 text-[#C4661F] dark:text-[#E87A2C]'
            : 'bg-forest/15 text-forest dark:text-emerald-300'
        }`}>
          {title}
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse text-sm m-0 min-w-[480px]">
          {headers.length > 0 && (
            <thead
              className={`border-b border-border text-xs uppercase tracking-wider font-display font-bold ${
                isSaaSBlog
                  ? 'bg-[#C4661F]/10 text-stone-900 dark:text-stone-100'
                  : 'bg-forest/10 text-forest dark:text-emerald-300'
              }`}
            >
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider align-middle border-b border-border"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-border/60 bg-background/40">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="transition-colors hover:bg-muted/40 even:bg-muted/15">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="py-3 px-4 text-stone-700 dark:text-stone-300 align-middle text-sm leading-relaxed"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
