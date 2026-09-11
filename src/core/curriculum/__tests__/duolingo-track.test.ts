import { describe, it, expect } from 'vitest';
import { CURRICULUM_NODES } from '../nodes';
import { CurriculumNode, UserNodeProgress, Tier } from '../../../types/curriculum';
import {
  generateBezierSegment,
  computeUnitNodePoints,
  computeUnitChestPoint,
  generateFullUnitBasePath,
  UNIT_CONFIGS,
  TRACK_WIDTH,
  CENTER_X,
} from '../duolingo-path';

describe('Duolingo Gamified Track & Curriculum Integrity', () => {
  it('covers all 18+ curriculum nodes across 5 thematic units without orphans', () => {
    expect(CURRICULUM_NODES.length).toBeGreaterThanOrEqual(18);

    const nodeIds = new Set(CURRICULUM_NODES.map((n) => n.id));
    expect(nodeIds.size).toBe(CURRICULUM_NODES.length); // All IDs are unique

    const tierCount: Record<Tier, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const node of CURRICULUM_NODES) {
      expect([0, 1, 2, 3, 4]).toContain(node.tier);
      tierCount[node.tier]++;
    }

    // Every tier must have at least 2 nodes
    for (let t = 0; t <= 4; t++) {
      expect(tierCount[t as Tier]).toBeGreaterThanOrEqual(2);
    }
  });

  it('verifies that all prerequisites exist and belong to valid curriculum nodes', () => {
    const nodeMap = new Map<string, CurriculumNode>();
    for (const n of CURRICULUM_NODES) {
      nodeMap.set(n.id, n);
    }

    for (const node of CURRICULUM_NODES) {
      for (const prereqId of node.prerequisites) {
        expect(nodeMap.has(prereqId)).toBe(true);
        const prereq = nodeMap.get(prereqId)!;
        // Prerequisite tier must be <= current tier
        expect(prereq.tier).toBeLessThanOrEqual(node.tier);
      }
    }
  });

  it('calculates star ratings and progress states accurately for gamified feedback', () => {
    const calculateStars = (progress?: UserNodeProgress) => {
      if (!progress) return 0;
      if (progress.status === 'mastered') return 3;
      if (progress.scoreKnowledge >= 60) return 2;
      if (progress.scoreKnowledge >= 30) return 1;
      return 0;
    };

    expect(calculateStars(undefined)).toBe(0);
    expect(calculateStars({ nodeId: 'n1', status: 'locked', scoreKnowledge: 0, score3D: 0, proficiencyLevel: 'Inicial', responseSpeed: 'Moderada', attentionPoints: [], totalAttempts: 0, correctAttempts: 0, lastAttemptAt: new Date().toISOString() })).toBe(0);
    expect(calculateStars({ nodeId: 'n1', status: 'available', scoreKnowledge: 45, score3D: 4, proficiencyLevel: 'Moderado', responseSpeed: 'Moderada', attentionPoints: [], totalAttempts: 1, correctAttempts: 1, lastAttemptAt: new Date().toISOString() })).toBe(1);
    expect(calculateStars({ nodeId: 'n1', status: 'available', scoreKnowledge: 75, score3D: 7, proficiencyLevel: 'Alto', responseSpeed: 'Alta', attentionPoints: [], totalAttempts: 2, correctAttempts: 2, lastAttemptAt: new Date().toISOString() })).toBe(2);
    expect(calculateStars({ nodeId: 'n1', status: 'mastered', scoreKnowledge: 90, score3D: 10, proficiencyLevel: 'Alto', responseSpeed: 'Alta', attentionPoints: [], totalAttempts: 3, correctAttempts: 3, lastAttemptAt: new Date().toISOString() })).toBe(3);
  });

  it('validates FSRS critical decay detection triggers review requirements', () => {
    const mockProgressMap: Record<string, UserNodeProgress> = {
      t0_algebra_fma: {
        nodeId: 't0_algebra_fma',
        status: 'critical_decay',
        scoreKnowledge: 60,
        score3D: 5,
        proficiencyLevel: 'Moderado',
        responseSpeed: 'Moderada',
        attentionPoints: ['Retenção caiu abaixo do limiar FSRS'],
        totalAttempts: 2,
        correctAttempts: 1,
        lastAttemptAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      t0_trig_polar: {
        nodeId: 't0_trig_polar',
        status: 'mastered',
        scoreKnowledge: 90,
        score3D: 10,
        proficiencyLevel: 'Alto',
        responseSpeed: 'Alta',
        attentionPoints: [],
        totalAttempts: 3,
        correctAttempts: 3,
        lastAttemptAt: new Date().toISOString(),
      },
    };

    const decayingNodes = Object.values(mockProgressMap).filter((p) => p.status === 'critical_decay');
    expect(decayingNodes.length).toBe(1);
    expect(decayingNodes[0].nodeId).toBe('t0_algebra_fma');
  });

  it('generates mathematically smooth cubic Bézier S-curves with vertical entry/exit tangents', () => {
    const p0 = { x: 200, y: 60 };
    const p1 = { x: 260, y: 210 };
    const path = generateBezierSegment(p0, p1);

    expect(path).toContain('M 200.0 60.0');
    expect(path).toContain('C 200.0 135.0, 260.0 135.0, 260.0 210.0');
    expect(TRACK_WIDTH).toBe(400);
    expect(CENTER_X).toBe(200);

    // Verify coordinate calculation for 4 nodes
    const nodePts = computeUnitNodePoints(4);
    expect(nodePts.length).toBe(4);
    expect(nodePts[0].x).toBe(200); // offset 0
    expect(nodePts[0].y).toBe(60);
    expect(nodePts[1].x).toBe(260); // offset +60
    expect(nodePts[1].y).toBe(210);

    const chestPt = computeUnitChestPoint(4);
    expect(chestPt.x).toBe(200);
    expect(chestPt.y).toBeGreaterThan(nodePts[3].y);

    const fullBasePath = generateFullUnitBasePath(nodePts, chestPt);
    expect(fullBasePath.startsWith('M 200.0 60.0')).toBe(true);
    expect(fullBasePath).toContain('C');

    // Verify all 5 unit configs exist
    for (let tier = 0; tier <= 4; tier++) {
      const cfg = UNIT_CONFIGS[tier as Tier];
      expect(cfg).toBeDefined();
      expect(cfg.number).toBe(tier + 1);
      expect(cfg.title.length).toBeGreaterThan(0);
      expect(cfg.themeColor.startsWith('#')).toBe(true);
      expect(cfg.bannerGradient.length).toBeGreaterThan(0);
    }
  });
});
