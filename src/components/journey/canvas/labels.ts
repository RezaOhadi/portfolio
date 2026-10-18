/**
 * DOM label nodes for the exploded parts. The DOM layer registers its nodes
 * here; the render loop writes their transform and opacity directly, so
 * labels track the 3D parts without a single React render per frame.
 */
export const labelNodes = new Map<string, HTMLElement>();

/**
 * Where the biography copy starts, when it sits beside the diagram (761px and
 * up). Leaders stop short of it so no hairline ever crosses the text. Infinity
 * means "no column to avoid" (phones lay the copy below, and fade the labels).
 */
export const labelLayout = { copyLeft: Infinity };

export function registerLabel(id: string, node: HTMLElement | null) {
  if (node) labelNodes.set(id, node);
  else labelNodes.delete(id);
}
