import { createClient } from "@supabase/supabase-js";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { requireEnv } from "./config.js";

export function admin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function r2() {
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

export async function downloadObject(objectKey: string) {
  const client = r2();
  const res = await client.send(
    new GetObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: objectKey,
    }),
  );
  if (!res.Body) throw new Error("Empty R2 object");
  const bytes = await res.Body.transformToByteArray();
  return {
    bytes: Buffer.from(bytes),
    contentType: res.ContentType ?? null,
  };
}

export async function uploadObject(params: {
  objectKey: string;
  body: Buffer;
  contentType: string;
}) {
  const client = r2();
  await client.send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: params.objectKey,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}
