import { Tier } from '@/types/curriculum';

export interface UnitConfig {
  tier: Tier;
  number: number;
  title: string;
  subtitle: string;
  themeColor: string;
  themeDarkColor: string;
  borderColor: string;
  bgGradient: string;
  bannerGradient: string;
}

export const UNIT_CONFIGS: Record<Tier, UnitConfig> = {
  0: {
    tier: 0,
    number: 1,
    title: 'Fundamentos Algébricos & GPU',
    subtitle: 'Fatoração Horner, FMA de ciclo único e coordenadas polares em shaders',
    themeColor: '#38bdf8',
    themeDarkColor: '#0284c7',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    bgGradient: 'from-sky-950/40 via-transparent to-transparent',
    bannerGradient: 'from-sky-900/60 to-slate-900/80',
  },
  1: {
    tier: 1,
    number: 2,
    title: 'Álgebra Linear & Transformações 3D',
    subtitle: 'Vetores, produto interno, cross product, matrizes MVP e quaternions',
    themeColor: '#6366f1',
    themeDarkColor: '#4338ca',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    bgGradient: 'from-indigo-950/40 via-transparent to-transparent',
    bannerGradient: 'from-indigo-900/60 to-slate-900/80',
  },
  2: {
    tier: 2,
    number: 3,
    title: 'Cálculo Diferencial & SDFs',
    subtitle: 'Derivadas parciais, gradientes de campo escalar, raymarching e sombras suaves',
    themeColor: '#10b981',
    themeDarkColor: '#047857',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    bgGradient: 'from-emerald-950/40 via-transparent to-transparent',
    bannerGradient: 'from-emerald-900/60 to-slate-900/80',
  },
  3: {
    tier: 3,
    number: 4,
    title: 'Cálculo Integral & Radiometria',
    subtitle: 'Integração de Monte Carlo, equação de renderização PBR e amostragem de cosseno',
    themeColor: '#a855f7',
    themeDarkColor: '#7e22ce',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    bgGradient: 'from-purple-950/40 via-transparent to-transparent',
    bannerGradient: 'from-purple-900/60 to-slate-900/80',
  },
  4: {
    tier: 4,
    number: 5,
    title: 'Campos Vetoriais & Tensores',
    subtitle: 'Divergente, rotacional em fluidos GPU, curvas de Bézier e tensores de Cauchy',
    themeColor: '#f59e0b',
    themeDarkColor: '#b45309',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    bgGradient: 'from-amber-950/40 via-transparent to-transparent',
    bannerGradient: 'from-amber-900/60 to-slate-900/80',
  },
};

// Layout geometry constants for the gamified Duolingo path
export const TRACK_WIDTH = 400;
export const CENTER_X = TRACK_WIDTH / 2; // 200px
export const START_Y = 60;
export const NODE_SPACING_Y = 150;
export const CHEST_SPACING_Y = 130;
export const S_CURVE_OFFSETS = [0, 60, 95, 65, 0, -65, -95, -60];

export interface TrackPoint {
  x: number;
  y: number;
}

/**
 * Generate cubic Bézier S-curve SVG path segment connecting (x0, y0) to (x1, y1)
 * with vertical entry/exit tangents for continuous smooth curvature.
 */
export function generateBezierSegment(p0: TrackPoint, p1: TrackPoint): string {
  const dy = p1.y - p0.y;
  const cp1Y = p0.y + dy * 0.5;
  const cp2Y = p1.y - dy * 0.5;
  return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${p0.x.toFixed(1)} ${cp1Y.toFixed(1)}, ${p1.x.toFixed(1)} ${cp2Y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
}

/**
 * Compute the list of 2D coordinates for stepping stones in a unit
 */
export function computeUnitNodePoints(nodeCount: number): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const offset = S_CURVE_OFFSETS[i % S_CURVE_OFFSETS.length];
    points.push({
      x: CENTER_X + offset,
      y: START_Y + i * NODE_SPACING_Y,
    });
  }
  return points;
}

/**
 * Compute the 2D coordinate for the milestone chest at the end of a unit
 */
export function computeUnitChestPoint(nodeCount: number): TrackPoint {
  return {
    x: CENTER_X,
    y: START_Y + Math.max(nodeCount - 1, 0) * NODE_SPACING_Y + CHEST_SPACING_Y,
  };
}

/**
 * Generate a continuous base spline SVG path connecting all node points down to the chest
 */
export function generateFullUnitBasePath(nodePoints: TrackPoint[], chestPoint: TrackPoint): string {
  if (nodePoints.length === 0) return '';
  let path = `M ${nodePoints[0].x.toFixed(1)} ${nodePoints[0].y.toFixed(1)}`;
  for (let i = 1; i < nodePoints.length; i++) {
    const dy = nodePoints[i].y - nodePoints[i - 1].y;
    path += ` C ${nodePoints[i - 1].x.toFixed(1)} ${(nodePoints[i - 1].y + dy * 0.5).toFixed(1)}, ${nodePoints[i].x.toFixed(1)} ${(nodePoints[i].y - dy * 0.5).toFixed(1)}, ${nodePoints[i].x.toFixed(1)} ${nodePoints[i].y.toFixed(1)}`;
  }
  const lastNode = nodePoints[nodePoints.length - 1];
  const dyChest = chestPoint.y - lastNode.y;
  path += ` C ${lastNode.x.toFixed(1)} ${(lastNode.y + dyChest * 0.5).toFixed(1)}, ${chestPoint.x.toFixed(1)} ${(chestPoint.y - dyChest * 0.5).toFixed(1)}, ${chestPoint.x.toFixed(1)} ${chestPoint.y.toFixed(1)}`;
  return path;
}
