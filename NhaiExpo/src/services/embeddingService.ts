import { CapturedPhoto, FaceDetectionResult } from '../models/types';
import { buildAppearanceEmbedding, getFaceModelCrop } from '../utils/imageProcessing';
import { l2Normalize } from '../utils/similarity';

export const EMBEDDING_SIZE = 192;

export async function extractEmbedding(
  photo: CapturedPhoto,
  face: FaceDetectionResult,
): Promise<number[]> {
  const crop = await getFaceModelCrop(photo, face);
  const embedding = l2Normalize(buildAppearanceEmbedding(crop));

  if (!isValidEmbedding(embedding)) {
    throw new Error('Generated embedding is invalid.');
  }

  return embedding;
}

export function isValidEmbedding(embedding: number[]): boolean {
  return (
    Array.isArray(embedding) &&
    embedding.length === EMBEDDING_SIZE &&
    embedding.every(value => Number.isFinite(value)) &&
    embedding.reduce((sum, value) => sum + Math.abs(value), 0) > 0.001
  );
}
