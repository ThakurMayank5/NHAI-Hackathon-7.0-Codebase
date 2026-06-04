import { CapturedPhoto, FaceDetectionResult } from '../models/types';
import { MODEL_REGISTRY } from './modelRegistry';
import { centeredFaceCrop, getFaceModelCrop, measureImageQuality } from '../utils/imageProcessing';

export async function detectFace(photo: CapturedPhoto): Promise<FaceDetectionResult> {
  const crop = await getFaceModelCrop(photo);
  const quality = measureImageQuality(crop);

  if (quality.brightness < 35 || quality.brightness > 235) {
    throw new Error('Face image lighting is not usable. Please recapture.');
  }

  if (quality.contrast < 12 || quality.sharpness < 3) {
    throw new Error('No clear face detected. Please center one face in the frame.');
  }

  const faceCrop = centeredFaceCrop(photo);
  const confidence = Math.min(
    0.98,
    Math.max(0.5, quality.contrast / 55 + quality.sharpness / 80),
  );

  return {
    x: faceCrop.originX,
    y: faceCrop.originY,
    width: faceCrop.width,
    height: faceCrop.height,
    confidence,
    provider: MODEL_REGISTRY.detection.id,
  };
}
