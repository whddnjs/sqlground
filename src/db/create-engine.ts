import type { AsyncDbEngine } from './engine'
import { WorkerEngine } from './worker/worker-engine'

export function createEngine(): AsyncDbEngine {
  return new WorkerEngine()
}
