/**
 * Parses a user-supplied page string into 0-based page indices.
 * Accepts: "1,3,5-7,10" → [0,2,4,5,6,9]
 * Page numbers are 1-based in input, 0-based in output.
 */
export function parsePageIndices(input: string, total: number): number[] {
  const indices = new Set<number>();

  for (const part of input.split(',')) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= total) indices.add(i - 1);
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= total) indices.add(page - 1);
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Parses a range string into groups of 0-based page index arrays.
 * "1-3,7-9" → [[0,1,2], [6,7,8]]
 */
export function parseRangeGroups(input: string, total: number): number[][] {
  const groups: number[][] = [];

  for (const part of input.split(',')) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);

    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1], 10));
      const end = Math.min(total, parseInt(rangeMatch[2], 10));
      if (start <= end) {
        groups.push(
          Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i),
        );
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= total) {
        groups.push([page - 1]);
      }
    }
  }

  return groups;
}

/**
 * Chunks a 0-based page index array into groups of size n.
 */
export function chunkByN(total: number, n: number): number[][] {
  const groups: number[][] = [];
  for (let i = 0; i < total; i += n) {
    groups.push(
      Array.from({ length: Math.min(n, total - i) }, (_, j) => i + j),
    );
  }
  return groups;
}
