import { CubicBezierCurve, CurvePath, LineCurve, Shape, Vector2 } from "three";

/**
 * Plan view of a ~2.1 m concert grand, in metres. 2D coordinates are
 * (x, depth): x runs bass (-) to treble (+), depth runs from the keyboard
 * (0) back to the tail. World space maps depth to -z.
 *
 * The path is open at the keyboard: it starts at the treble cheek, follows the
 * bentside S-curve and the tail, and returns down the straight bass side.
 */
export const RIM = { halfWidth: 0.74, bottom: 0.66, height: 0.32, thickness: 0.034 } as const;
export const RIM_TOP = RIM.bottom + RIM.height;

function rimPath() {
  const p = new CurvePath<Vector2>();
  const v = (x: number, d: number) => new Vector2(x, d);
  const w = RIM.halfWidth;
  p.add(new LineCurve(v(w, 0), v(w, 0.4)));
  p.add(new CubicBezierCurve(v(w, 0.4), v(w, 0.95), v(0.16, 1.02), v(0.1, 1.5)));
  p.add(new CubicBezierCurve(v(0.1, 1.5), v(0.05, 1.92), v(-0.22, 2.08), v(-0.46, 2.06)));
  p.add(new CubicBezierCurve(v(-0.46, 2.06), v(-0.66, 2.04), v(-w, 1.92), v(-w, 1.74)));
  p.add(new LineCurve(v(-w, 1.74), v(-w, 0)));
  return p;
}

export interface OutlinePoint {
  p: Vector2;
  /** Unit normal pointing into the case. */
  n: Vector2;
}

/** Evenly spaced points along the rim with inward normals (path runs counter-clockwise). */
export function rimPoints(count = 180): OutlinePoint[] {
  const pts = rimPath().getSpacedPoints(count);
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const t = new Vector2().subVectors(b, a).normalize();
    return { p, n: new Vector2(-t.y, t.x) };
  });
}

/** Closed plan shape, optionally inset into the case and with holes. */
export function planShape(inset = 0, holes: Vector2[][] = []): Shape {
  const pts = rimPoints(160).map(({ p, n }) => new Vector2(p.x + n.x * inset, Math.max(inset, p.y + n.y * inset)));
  const shape = new Shape(pts);
  shape.closePath();
  for (const hole of holes) {
    const path = new Shape(hole);
    path.closePath();
    shape.holes.push(path);
  }
  return shape;
}

/** Depth of the rim's inner wall at a given x (the far end of a string at x). */
export function depthAt(x: number, points = rimPoints(240)): number {
  let best = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i].p;
    const b = points[i + 1].p;
    if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) {
      const t = (x - a.x) / (b.x - a.x);
      best = Math.max(best, a.y + (b.y - a.y) * t);
    }
  }
  return best - RIM.thickness;
}

/** Ellipse used for the openings cast into the plate. */
export function ellipse(cx: number, cd: number, rx: number, rd: number, rot = 0, n = 28): Vector2[] {
  const out: Vector2[] = [];
  // Holes must wind opposite to the outer shape.
  for (let i = n - 1; i >= 0; i--) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const d = Math.sin(a) * rd;
    out.push(new Vector2(cx + x * Math.cos(rot) - d * Math.sin(rot), cd + x * Math.sin(rot) + d * Math.cos(rot)));
  }
  return out;
}
