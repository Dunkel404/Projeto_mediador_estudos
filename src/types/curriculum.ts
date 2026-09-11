export type Tier = 0 | 1 | 2 | 3 | 4;

export type NodeCategory =
  | 'algebra_trigonometry'
  | 'linear_algebra'
  | 'differential_calculus'
  | 'integral_calculus'
  | 'vector_fields_tensors';

export type NodeStatus = 'locked' | 'available' | 'mastered' | 'critical_decay';

export type ProficiencyLevel = 'Inicial' | 'Moderado' | 'Alto' | 'Altíssimo';

export type ResponseSpeed = 'Lenta' | 'Moderada' | 'Alta' | 'Altíssima';

export interface CurriculumNode {
  id: string;
  tier: Tier;
  title: string;
  category: NodeCategory;
  mathFoundation: string;
  graphicApplication: string;
  prerequisites: string[];
  latexFormulas: string[];
  defaultGlslShader: string;
  targetScoreKnowledge: number; // Ex: 90
  targetScore3D: number; // Ex: 10
  gridPosition: { x: number; y: number }; // For 2D desktop spatial graph
}

export interface UserNodeProgress {
  nodeId: string;
  status: NodeStatus;
  scoreKnowledge: number; // 0 to 90
  score3D: number; // 0 to 10
  proficiencyLevel: ProficiencyLevel;
  responseSpeed: ResponseSpeed;
  attentionPoints: string[];
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptAt?: string;
}
