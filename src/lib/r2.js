/**
 * Cloudflare R2 Client - Audio File Storage
 * S3-compatible API
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mystation-audio';

// R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
const r2Endpoint = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : null;

export const r2Client = r2Endpoint && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

// Upload audio file to R2
export const uploadAudio = async (file, filename) => {
  if (!r2Client) {
    console.warn('R2 not configured. Using local storage.');
    return null;
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: `audio/${filename}`,
    Body: file,
    ContentType: file.type || 'audio/mpeg',
  });

  await r2Client.send(command);

  // Return public URL (if bucket is public) or signed URL
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/audio/${filename}`;
};

// Get signed URL for private audio
export const getAudioUrl = async (filename, expiresIn = 3600) => {
  if (!r2Client) return `/audio/${filename}`; // Fallback to local

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: `audio/${filename}`,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
};

// List all audio files
export const listAudioFiles = async () => {
  if (!r2Client) return [];

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: 'audio/',
  });

  const response = await r2Client.send(command);
  return response.Contents || [];
};

// Public R2 URL (for public buckets)
export const getPublicUrl = (filename) => {
  if (!R2_ACCOUNT_ID) return `/audio/${filename}`;

  // If using custom domain or public bucket
  const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (publicDomain) {
    return `${publicDomain}/audio/${filename}`;
  }

  return `/audio/${filename}`;
};

export default r2Client;
