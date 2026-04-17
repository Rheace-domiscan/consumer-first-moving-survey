type StorageUploadResult = {
  key: string;
  url: string | null;
};

export async function uploadToObjectStorage(input: {
  fileName: string;
  contentType?: string;
  buffer: Buffer;
}) : Promise<StorageUploadResult> {
  const key = buildStorageKey(input.fileName);

  if (!hasS3CompatibleEnv()) {
    return {
      key,
      url: null,
    };
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.STORAGE_REGION,
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
    }),
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export function hasS3CompatibleEnv() {
  return Boolean(
    process.env.STORAGE_BUCKET &&
      process.env.STORAGE_REGION &&
      process.env.STORAGE_ACCESS_KEY_ID &&
      process.env.STORAGE_SECRET_ACCESS_KEY &&
      process.env.STORAGE_ENDPOINT,
  );
}

function buildStorageKey(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `survey-media/${Date.now()}-${safeName}`;
}

function buildPublicUrl(key: string) {
  if (process.env.STORAGE_PUBLIC_BASE_URL) {
    return `${process.env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  return null;
}
