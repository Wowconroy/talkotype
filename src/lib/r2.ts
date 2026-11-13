import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getR2Client() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function buildObjectKey(params: {
  userId: string;
  transcriptId: string;
  kind: "original" | "extracted_audio" | "other";
  filename: string;
}) {
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return `users/${params.userId}/transcripts/${params.transcriptId}/${params.kind}/${Date.now()}-${safeName}`;
}

export async function createUploadUrl(params: {
  objectKey: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: params.objectKey,
    ContentType: params.contentType,
  });
  return getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60 * 15,
  });
}

export async function createDownloadUrl(params: {
  objectKey: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: params.objectKey,
  });
  return getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60 * 10,
  });
}

export async function deleteObject(objectKey: string) {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: objectKey,
    }),
  );
}

/** Best-effort wipe of known keys + anything under the transcript prefix. */
export async function deleteTranscriptStorage(params: {
  userId: string;
  transcriptId: string;
  objectKeys?: string[];
}) {
  if (!isR2Configured()) return { deleted: 0 };

  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  const prefix = `users/${params.userId}/transcripts/${params.transcriptId}/`;
  const keys = new Set(
    (params.objectKeys ?? []).filter((k) => typeof k === "string" && k.length),
  );

  let token: string | undefined;
  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of listed.Contents ?? []) {
      if (obj.Key) keys.add(obj.Key);
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);

  const list = [...keys];
  let deleted = 0;
  for (let i = 0; i < list.length; i += 1000) {
    const chunk = list.slice(i, i + 1000);
    if (chunk.length === 1) {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: chunk[0] }),
      );
      deleted += 1;
      continue;
    }
    if (!chunk.length) continue;
    const res = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
    deleted += chunk.length - (res.Errors?.length ?? 0);
  }
  return { deleted };
}

export async function getObjectBytes(objectKey: string): Promise<{
  bytes: Uint8Array;
  contentType: string | null;
}> {
  const client = getR2Client();
  const res = await client.send(
    new GetObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: objectKey,
    }),
  );
  if (!res.Body) {
    throw new Error("Empty object body from R2.");
  }
  const ab = await res.Body.transformToByteArray();
  return {
    bytes: ab,
    contentType: res.ContentType ?? null,
  };
}

/**
 * @deprecated Prefer mediaExpiresAt(plan) from plan-limits.
 * Kept as free-plan default (7 days) for any leftover callers.
 */
export function defaultOriginalExpiry(from = new Date()) {
  return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}
