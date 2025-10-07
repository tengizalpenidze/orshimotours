import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Helper function to properly format Google Cloud private key
function formatPrivateKey(key: string): string {
  // Handle multiple formats of escaped newlines
  let formattedKey = key;
  
  // Replace literal \n with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  // If key doesn't start with the PEM header, it might be base64 encoded
  if (!formattedKey.includes('BEGIN PRIVATE KEY')) {
    try {
      // Try to decode from base64
      formattedKey = Buffer.from(formattedKey, 'base64').toString('utf-8');
    } catch (e) {
      // Not base64, continue with original
    }
  }
  
  // Ensure proper PEM format with newlines
  if (formattedKey.includes('BEGIN PRIVATE KEY') && !formattedKey.includes('\n')) {
    // Key is all on one line, need to add newlines
    formattedKey = formattedKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
      .replace(/(.{64})/g, '$1\n') // Add newline every 64 chars (standard PEM format)
      .replace(/\n\n/g, '\n'); // Remove double newlines
  }
  
  return formattedKey;
}

// The object storage client is used to interact with the object storage service.
// Supports both Replit (sidecar) and external deployments (service account credentials)
export const objectStorageClient = new Storage(
  process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    ? {
        // Use service account credentials for external deployments (Render, etc.)
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
        },
      }
    : {
        // Use Replit sidecar for Replit deployments
        credentials: {
          audience: "replit",
          subject_token_type: "access_token",
          token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
          type: "external_account",
          credential_source: {
            url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
            format: {
              type: "json",
              subject_token_field_name: "access_token",
            },
          },
          universe_domain: "googleapis.com",
        },
        projectId: "",
      }
);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object.
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    const uploadURL = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });

    // Return both the upload URL and the object path for later use
    const objectPath = `/objects/uploads/${objectId}`;
    return { uploadURL, objectPath };
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/") && 
        !rawPath.startsWith("https://storage.cloud.google.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    let rawObjectPath = url.pathname;
  
    // For external deployments using DEFAULT_OBJECT_STORAGE_BUCKET_ID,
    // strip the bucket prefix from the path
    if (process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) {
      const bucketPrefix = `/${process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID}/`;
      if (rawObjectPath.startsWith(bucketPrefix)) {
        // Remove bucket prefix, result will start with the object path (e.g., ".private/uploads/...")
        rawObjectPath = rawObjectPath.slice(bucketPrefix.length);
      }
    }
  
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
  
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
  
    // Extract the entity ID from the path
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    console.log('[OBJECT-STORAGE] 🔄 trySetObjectEntityAclPolicy called', {
      rawPath,
      aclPolicy
    });
    
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    console.log('[OBJECT-STORAGE] 📝 Normalized path:', {
      rawPath,
      normalizedPath,
      startsWithSlash: normalizedPath.startsWith("/")
    });
    
    if (!normalizedPath.startsWith("/")) {
      console.log('[OBJECT-STORAGE] ⏭️ Path does not start with /, returning as-is');
      return normalizedPath;
    }

    console.log('[OBJECT-STORAGE] 📂 Getting object entity file...');
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    console.log('[OBJECT-STORAGE] ✅ Object file retrieved:', {
      bucket: objectFile.bucket.name,
      fileName: objectFile.name
    });
    
    console.log('[OBJECT-STORAGE] 🔐 Setting ACL policy on object...');
    await setObjectAclPolicy(objectFile, aclPolicy);
    console.log('[OBJECT-STORAGE] ✅ ACL policy set successfully');
    
    return normalizedPath;
  }

  // Gets the ACL policy for an object.
  async getObjectAclPolicy(objectFile: File): Promise<ObjectAclPolicy | null> {
    return getObjectAclPolicy(objectFile);
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  let bucketName = pathParts[1];
  let objectName = pathParts.slice(2).join("/");
  
  // For external deployments (Render), use DEFAULT_OBJECT_STORAGE_BUCKET_ID
  // and prefix the object name with the directory path
  if (process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) {
    const defaultBucket = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    // If bucketName is ".private" or "public", use the default bucket
    // and include the directory in the object path
    if (bucketName === ".private" || bucketName === "public") {
      objectName = `${bucketName}/${objectName}`;
      bucketName = defaultBucket;
    }
  }

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  // Check if using external deployment (service account credentials)
  const isExternalDeployment = 
    process.env.GOOGLE_PROJECT_ID && 
    process.env.GOOGLE_CLIENT_EMAIL && 
    process.env.GOOGLE_PRIVATE_KEY;

  if (isExternalDeployment) {
    // Use GCS SDK to generate signed URL for external deployments
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const action = method === 'PUT' ? 'write' : method === 'DELETE' ? 'delete' : 'read';
    
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action,
      expires: Date.now() + ttlSec * 1000,
      // Don't specify contentType - let browser send the actual file type
    });
    
    return signedUrl;
  } else {
    // Use Replit sidecar for Replit deployments
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}, ` +
          `make sure you're running on Replit`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }
}
