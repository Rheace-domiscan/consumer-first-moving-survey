import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

type StorageUploadResult = {
  key: string;
  url: string | null;
};

type ObjectStorageAdapter = {
  upload(input: {
    key: string;
    buffer: Buffer;
    contentType?: string;
  }): Promise<void>;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  publicUrlForKey(key: string): string | null;
};

type S3CompatibleConfig = {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string | undefined;
};

export async function uploadToObjectStorage(input: {
  fileName: string;
  contentType?: string;
  buffer: Buffer;
}): Promise<StorageUploadResult> {
  const key = buildStorageKey(input.fileName);
  await writeLocalMirror(key, input.buffer);

  const adapter = await getObjectStorageAdapter();

  if (!adapter) {
    return {
      key,
      url: null,
    };
  }

  await adapter.upload({
    key,
    buffer: input.buffer,
    contentType: input.contentType,
  });

  return {
    key,
    url: adapter.publicUrlForKey(key),
  };
}

export async function deleteFromObjectStorage(key: string) {
  await deleteLocalMirror(key);

  const adapter = await getObjectStorageAdapter();

  if (!adapter) {
    return;
  }

  await adapter.delete(key);
}

export function hasS3CompatibleEnv() {
  return env.s3StorageConfigured;
}

export async function ensureLocalMediaMirror(input: {
  storageKey: string;
  storageUrl?: string | null;
}) {
  const mirrorPath = localMirrorPathForKey(input.storageKey);

  if (await fileExists(mirrorPath)) {
    return mirrorPath;
  }

  let buffer: Buffer | null = null;
  const adapter = await getObjectStorageAdapter();

  if (adapter) {
    buffer = await adapter.read(input.storageKey);
  } else if (input.storageUrl) {
    buffer = await readFromPublicUrl(input.storageUrl);
  }

  if (!buffer) {
    return null;
  }

  await writeLocalMirror(input.storageKey, buffer);
  return mirrorPath;
}

export function localMirrorPathForKey(key: string) {
  return path.join(localMirrorRoot(), key);
}

async function getObjectStorageAdapter(): Promise<ObjectStorageAdapter | null> {
  const config = getS3CompatibleConfig();

  if (!config) {
    return null;
  }

  const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    async upload(input) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: input.key,
          Body: input.buffer,
          ContentType: input.contentType,
        }),
      );
    },
    async delete(key) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: key,
        }),
      );
    },
    async read(key) {
      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );

        if (!response.Body) {
          return null;
        }

        const body = response.Body as {
          transformToByteArray?: () => Promise<Uint8Array>;
        };

        if (!body.transformToByteArray) {
          return null;
        }

        return Buffer.from(await body.transformToByteArray());
      } catch {
        return null;
      }
    },
    publicUrlForKey(key) {
      return config.publicBaseUrl ? `${config.publicBaseUrl}/${key}` : null;
    },
  };
}

function getS3CompatibleConfig(): S3CompatibleConfig | null {
  if (!env.s3StorageConfigured) {
    return null;
  }

  return {
    bucket: env.storageBucket!,
    region: env.storageRegion!,
    endpoint: env.storageEndpoint!,
    accessKeyId: env.storageAccessKeyId!,
    secretAccessKey: env.storageSecretAccessKey!,
    publicBaseUrl: env.storagePublicBaseUrl,
  };
}

async function readFromPublicUrl(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function writeLocalMirror(key: string, buffer: Buffer) {
  const destination = localMirrorPathForKey(key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer);
}

async function deleteLocalMirror(key: string) {
  const destination = localMirrorPathForKey(key);
  await fs.rm(destination, { force: true }).catch(() => undefined);
}

function localMirrorRoot() {
  if (env.localMediaRoot) {
    return path.resolve(/* turbopackIgnore: true */ env.localMediaRoot);
  }

  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "media-cache");
}

async function fileExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function buildStorageKey(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `survey-media/${Date.now()}-${safeName}`;
}
