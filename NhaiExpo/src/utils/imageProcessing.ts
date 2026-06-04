import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'jpeg-js';
import { CapturedPhoto, FaceDetectionResult } from '../models/types';

export interface DecodedFaceCrop {
  width: number;
  height: number;
  data: Uint8Array;
  base64: string;
}

const MODEL_IMAGE_SIZE = 112;

export async function getFaceModelCrop(
  photo: CapturedPhoto,
  face?: FaceDetectionResult,
): Promise<DecodedFaceCrop> {
  const crop = face ? faceToCrop(face, photo) : centeredFaceCrop(photo);
  const result = await ImageManipulator.manipulateAsync(
    photo.uri,
    [
      { crop },
      { resize: { width: MODEL_IMAGE_SIZE, height: MODEL_IMAGE_SIZE } },
    ],
    {
      base64: true,
      compress: 0.92,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  if (!result.base64) {
    throw new Error('Image preprocessing did not return base64 data.');
  }

  const decoded = decode(base64ToBytes(result.base64), { useTArray: true });

  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
    base64: result.base64,
  };
}

export function centeredFaceCrop(photo: CapturedPhoto) {
  const width = Math.max(1, photo.width);
  const height = Math.max(1, photo.height);
  const side = Math.floor(Math.min(width, height) * 0.72);

  return {
    originX: Math.floor((width - side) / 2),
    originY: Math.floor((height - side) / 2),
    width: side,
    height: side,
  };
}

export function measureImageQuality(crop: DecodedFaceCrop) {
  let sum = 0;
  let sumSquares = 0;
  let edgeSum = 0;
  let count = 0;

  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const offset = (y * crop.width + x) * 4;
      const luma = rgbToLuma(crop.data[offset], crop.data[offset + 1], crop.data[offset + 2]);
      sum += luma;
      sumSquares += luma * luma;
      count += 1;

      if (x > 0) {
        const leftOffset = (y * crop.width + x - 1) * 4;
        const leftLuma = rgbToLuma(
          crop.data[leftOffset],
          crop.data[leftOffset + 1],
          crop.data[leftOffset + 2],
        );
        edgeSum += Math.abs(luma - leftLuma);
      }

      if (y > 0) {
        const upOffset = ((y - 1) * crop.width + x) * 4;
        const upLuma = rgbToLuma(
          crop.data[upOffset],
          crop.data[upOffset + 1],
          crop.data[upOffset + 2],
        );
        edgeSum += Math.abs(luma - upLuma);
      }
    }
  }

  const mean = sum / count;
  const variance = sumSquares / count - mean * mean;
  const contrast = Math.sqrt(Math.max(0, variance));
  const sharpness = edgeSum / count;

  return {
    brightness: mean,
    contrast,
    sharpness,
  };
}

export function buildAppearanceEmbedding(crop: DecodedFaceCrop): number[] {
  const gridSize = 8;
  const histogramBins = 64;
  const cellMeans: number[] = [];
  const cellEdges: number[] = [];
  const histogram = new Array(histogramBins).fill(0);

  const lumas = new Float32Array(crop.width * crop.height);
  let globalSum = 0;

  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const index = y * crop.width + x;
      const offset = index * 4;
      const luma = rgbToLuma(crop.data[offset], crop.data[offset + 1], crop.data[offset + 2]);
      lumas[index] = luma;
      globalSum += luma;
      histogram[Math.min(histogramBins - 1, Math.floor(luma / 4))] += 1;
    }
  }

  const globalMean = globalSum / lumas.length;
  const globalStd = Math.sqrt(
    lumas.reduce((sum, luma) => sum + (luma - globalMean) ** 2, 0) / lumas.length,
  ) || 1;

  for (let gy = 0; gy < gridSize; gy += 1) {
    for (let gx = 0; gx < gridSize; gx += 1) {
      const startX = Math.floor((gx * crop.width) / gridSize);
      const endX = Math.floor(((gx + 1) * crop.width) / gridSize);
      const startY = Math.floor((gy * crop.height) / gridSize);
      const endY = Math.floor(((gy + 1) * crop.height) / gridSize);

      let sum = 0;
      let edge = 0;
      let count = 0;

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const index = y * crop.width + x;
          const luma = lumas[index];
          sum += luma;
          count += 1;

          if (x > startX) {
            edge += Math.abs(luma - lumas[index - 1]);
          }
          if (y > startY) {
            edge += Math.abs(luma - lumas[index - crop.width]);
          }
        }
      }

      cellMeans.push(((sum / count) - globalMean) / globalStd);
      cellEdges.push(edge / Math.max(1, count) / 32);
    }
  }

  const totalPixels = crop.width * crop.height;
  const histogramFeatures = histogram.map(count => count / totalPixels);

  return [...cellMeans, ...cellEdges, ...histogramFeatures];
}

function faceToCrop(face: FaceDetectionResult, photo: CapturedPhoto) {
  const padding = Math.max(face.width, face.height) * 0.18;
  const side = Math.min(
    Math.max(face.width, face.height) + padding * 2,
    photo.width,
    photo.height,
  );
  const centerX = face.x + face.width / 2;
  const centerY = face.y + face.height / 2;

  return {
    originX: Math.max(0, Math.floor(centerX - side / 2)),
    originY: Math.max(0, Math.floor(centerY - side / 2)),
    width: Math.floor(side),
    height: Math.floor(side),
  };
}

function rgbToLuma(red: number, green: number, blue: number): number {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);

  for (let index = 0; index < chars.length; index += 1) {
    lookup[chars.charCodeAt(index)] = index;
  }

  const clean = base64.replace(/[\r\n=]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let byteIndex = 0;

  for (let index = 0; index < clean.length; index += 4) {
    const encoded1 = lookup[clean.charCodeAt(index)];
    const encoded2 = lookup[clean.charCodeAt(index + 1)];
    const encoded3 = lookup[clean.charCodeAt(index + 2)];
    const encoded4 = lookup[clean.charCodeAt(index + 3)];

    if (byteIndex < bytes.length) {
      bytes[byteIndex] = (encoded1 << 2) | (encoded2 >> 4);
      byteIndex += 1;
    }
    if (byteIndex < bytes.length) {
      bytes[byteIndex] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      byteIndex += 1;
    }
    if (byteIndex < bytes.length) {
      bytes[byteIndex] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      byteIndex += 1;
    }
  }

  return bytes;
}
