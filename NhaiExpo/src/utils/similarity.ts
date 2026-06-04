import { Employee, RecognitionResult } from '../models/types';

export const DEFAULT_SIMILARITY_THRESHOLD = 0.78;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

export function l2Normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

  if (!Number.isFinite(norm) || norm === 0) {
    return values;
  }

  return values.map(value => value / norm);
}

export function findBestMatch(
  queryEmbedding: number[],
  employees: Employee[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): RecognitionResult {
  if (employees.length === 0) {
    return {
      matched: false,
      employee: null,
      similarity: 0,
      message: 'No enrolled employees found.',
    };
  }

  let bestEmployee: Employee | null = null;
  let bestSimilarity = -1;

  for (const employee of employees) {
    if (employee.embedding.length !== queryEmbedding.length) {
      continue;
    }

    const similarity = cosineSimilarity(queryEmbedding, employee.embedding);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestEmployee = employee;
    }
  }

  if (bestEmployee && bestSimilarity >= threshold) {
    return {
      matched: true,
      employee: bestEmployee,
      similarity: bestSimilarity,
      message: `Matched ${bestEmployee.name}`,
    };
  }

  return {
    matched: false,
    employee: null,
    similarity: Math.max(0, bestSimilarity),
    message: 'Unknown person.',
  };
}
