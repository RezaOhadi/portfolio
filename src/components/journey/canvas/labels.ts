/**
 * DOM label nodes for the exploded parts. The DOM layer registers its nodes
 * here; the render loop writes their transform and opacity directly, so
 * labels track the 3D parts without a single React render per frame.
 */
export const labelNodes = new Map<string, HTMLElement>();

export function registerLabel(id: string, node: HTMLElement | null) {
  if (node) labelNodes.set(id, node);
  else labelNodes.delete(id);
}
