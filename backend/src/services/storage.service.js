const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const isR2Configured = () =>
  !!(process.env.R2_ACCOUNT_ID &&
     process.env.R2_ACCESS_KEY_ID &&
     process.env.R2_SECRET_ACCESS_KEY &&
     process.env.R2_BUCKET_NAME);

const getR2PublicUrl = () => (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const ASSET_FIELDS = new Set(['photo', 'filePath', 'avatar']);
const DEFAULT_TTL_SECONDS = 60 * 30; // 30 min

let s3 = null;

function getS3() {
  if (!s3 && isR2Configured()) {
    s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

function getSigningSecret() {
  return process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET || '';
}

function getUploadsRoot() {
  return process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
}

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

class StorageService {
  isConfigured() {
    return isR2Configured();
  }

  /**
   * Upload a file buffer to R2 (prod) or local disk (dev fallback).
   * @returns {Promise<string>} stored reference (R2 key URL or /uploads/... path)
   */
  async upload(buffer, originalname, folder = 'documents') {
    const ext = path.extname(originalname).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    if (this.isConfigured()) {
      const upload = new Upload({
        client: getS3(),
        params: {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: MIME_MAP[ext] || 'application/octet-stream',
        },
      });
      await upload.done();

      // Prefer opaque key path in DB; keep R2_PUBLIC_URL prefix only for legacy compat
      // when bucket is still public. Access always goes through getAccessUrl().
      const baseUrl = getR2PublicUrl();
      return baseUrl ? `${baseUrl}/${key}` : `r2://${key}`;
    }

    const uploadDir = getUploadsRoot();
    const dir = path.join(uploadDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `/uploads/${folder}/${filename}`;
  }

  async delete(urlOrPath) {
    if (!urlOrPath) return;

    if (this.isConfigured()) {
      const key = this._extractKey(urlOrPath);
      if (!key) return;
      await getS3().send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }));
      return;
    }

    const localPath = this.resolveLocalPath(urlOrPath);
    if (localPath && fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }

  /**
   * Short-lived URL safe for <img src> / document viewers.
   * Local files → HMAC-signed /api/media. R2 → S3 presigned GET.
   */
  async getAccessUrl(storedPath, ttlSeconds = DEFAULT_TTL_SECONDS) {
    if (!storedPath || typeof storedPath !== 'string') return storedPath;

    // Already a signed /api/media URL
    if (storedPath.includes('/api/media?')) return storedPath;

    if (this.isConfigured()) {
      const key = this._extractKey(storedPath);
      if (!key) return storedPath;
      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      });
      return getSignedUrl(getS3(), command, { expiresIn: ttlSeconds });
    }

    if (!storedPath.startsWith('/uploads/')) return storedPath;
    return this._signLocalPath(storedPath, ttlSeconds);
  }

  /**
   * Deep-clone payload and replace photo / filePath / avatar with signed URLs.
   */
  async signAssets(value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    if (value == null) return value;
    if (value instanceof Date || Buffer.isBuffer(value)) return value;
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => this.signAssets(item, ttlSeconds)));
    }
    if (typeof value !== 'object') return value;

    const out = { ...value };
    await Promise.all(
      Object.keys(out).map(async (key) => {
        if (ASSET_FIELDS.has(key) && typeof out[key] === 'string') {
          out[key] = await this.getAccessUrl(out[key], ttlSeconds);
        } else if (out[key] && typeof out[key] === 'object') {
          out[key] = await this.signAssets(out[key], ttlSeconds);
        }
      }),
    );
    return out;
  }

  verifyLocalSignature(relativePath, exp, sig) {
    const secret = getSigningSecret();
    if (!secret || !relativePath || !exp || !sig) return false;
    if (Number(exp) * 1000 < Date.now()) return false;
    if (!relativePath.startsWith('/uploads/')) return false;
    if (relativePath.includes('..')) return false;

    const expected = this._hmac(`${relativePath}.${exp}`);
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)));
    } catch {
      return false;
    }
  }

  resolveLocalPath(storedPath) {
    if (!storedPath || typeof storedPath !== 'string') return null;
    if (!storedPath.startsWith('/uploads/')) return null;
    if (storedPath.includes('..')) return null;

    const relative = storedPath.replace(/^\/uploads\//, '');
    const absolute = path.join(getUploadsRoot(), relative);
    const root = path.resolve(getUploadsRoot());
    if (!absolute.startsWith(root + path.sep) && absolute !== root) return null;
    return absolute;
  }

  /**
   * Load file bytes for PDF generation (local disk or R2 GetObject).
   */
  async getObjectBuffer(storedPath) {
    if (!storedPath) return null;

    const localPath = this.resolveLocalPath(storedPath);
    if (localPath && fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    if (this.isConfigured()) {
      const key = this._extractKey(storedPath);
      if (!key) return null;
      try {
        const result = await getS3().send(new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        }));
        const bytes = await result.Body.transformToByteArray();
        return Buffer.from(bytes);
      } catch {
        return null;
      }
    }

    // Legacy absolute public URL fallback
    if (/^https?:\/\//i.test(storedPath)) {
      try {
        const response = await fetch(storedPath);
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
      } catch {
        return null;
      }
    }

    return null;
  }

  mimeForPath(filePath) {
    return MIME_MAP[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  }

  _signLocalPath(relativePath, ttlSeconds) {
    const secret = getSigningSecret();
    if (!secret) {
      throw new Error('JWT_SECRET or MEDIA_SIGNING_SECRET required to sign media URLs');
    }
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const sig = this._hmac(`${relativePath}.${exp}`);
    const params = new URLSearchParams({
      p: relativePath,
      e: String(exp),
      s: sig,
    });
    return `/api/media?${params.toString()}`;
  }

  _hmac(payload) {
    return crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
  }

  _extractKey(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('r2://')) return url.slice(5);
    try {
      const baseUrl = getR2PublicUrl();
      if (baseUrl && url.startsWith(baseUrl)) {
        return url.slice(baseUrl.length + 1);
      }
      if (url.startsWith('/uploads/')) return null;
      if (!/^https?:\/\//i.test(url) && url.includes('/')) {
        return url.replace(/^\//, '');
      }
      const u = new URL(url);
      return u.pathname.replace(/^\//, '');
    } catch {
      return url;
    }
  }
}

module.exports = new StorageService();
