import { segmentArcSolver } from './segmentArc';
import type { SegmentInputs, SegmentParams, ShapeId, ShapeSolver } from './types';

/**
 * Today there is one shape. As more shapes are added this alias widens to a union, but every
 * consumer (UI, export, storage) keeps talking to the same `ShapeSolver` contract.
 */
export type AnyShapeSolver = ShapeSolver<SegmentInputs, SegmentParams>;

const registry = new Map<ShapeId, AnyShapeSolver>([[segmentArcSolver.id, segmentArcSolver]]);

export function getSolver(id: ShapeId): AnyShapeSolver | undefined {
  return registry.get(id);
}
