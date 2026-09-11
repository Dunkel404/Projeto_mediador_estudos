import Dexie, { Table } from 'dexie';
import { UserNodeProgress, SubModule } from '@/types/curriculum';
import { FSRSCard } from '@/types/fsrs';

export interface AttemptLog {
  id?: number;
  nodeId: string;
  subModuleId?: string;
  timestamp: string;
  scoreKnowledge: number;
  score3D: number;
  timeSpentSeconds: number;
  userAnswer: string;
  isCorrect: boolean;
  diagnosticLogged?: string;
}

export interface UserSetting {
  key: string;
  value: string;
}

export class ShaderMathDatabase extends Dexie {
  userNodes!: Table<UserNodeProgress, string>;
  fsrsCards!: Table<FSRSCard, string>;
  attempts!: Table<AttemptLog, number>;
  settings!: Table<UserSetting, string>;
  dynamicSubmodules!: Table<SubModule, string>;

  constructor() {
    super('ShaderMathDB');
    this.version(1).stores({
      userNodes: 'nodeId, status, scoreKnowledge, score3D',
      fsrsCards: 'nodeId, due, state',
      attempts: '++id, nodeId, timestamp, isCorrect',
      settings: 'key',
    });
    this.version(2).stores({
      dynamicSubmodules: 'id, moduleId, order',
    });
  }
}

export const db = new ShaderMathDatabase();
