const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const isR2Configured = () =>
  !!(process.env.R2_ACCOUNT_ID &&
     process.env.R2_ACCESS_KEY_ID &&
     process.env.R2_SECRET_ACCESS_KEY &&
     process.env.R2_BUCKET_NAME);

const getR2PublicUrl = () => (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

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
   * @param {Buffer} buffer
   * @param {string} originalname - original filename (used for extension)
   * @param {string} folder - 'documents' | 'vehicles'
   * @returns {Promise<string>} public URL or local path
   */
  async upload(buffer, originalname, folder = 'documents') {
    const ext = path.extname(originalname).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    if (this.isConfigured()) {
      const baseUrl = getR2PublicUrl();
      if (!baseUrl) {
        throw new Error('R2_PUBLIC_URL est requis quand le stockage R2 est configure');
      }

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

      return `${baseUrl}/${key}`;
    }

    // Dev fallback: save to disk
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const dir = path.join(uploadDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `/uploads/${folder}/${filename}`;
  }

  /**
   * Delete a file by its stored URL or R2 key.
   */
  async delete(urlOrPath) {
    if (!urlOrPath) return;

    if (this.isConfigured()) {
      const key = this._extractKey(urlOrPath);
      if (!key) return;
      await getS3().send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }));
    } else {
      // Dev: delete local file
      if (urlOrPath.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../', urlOrPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
  }

  _extractKey(url) {
    try {
      const baseUrl = getR2PublicUrl();
      if (baseUrl && url.startsWith(baseUrl)) {
        return url.slice(baseUrl.length + 1);
      }
      const u = new URL(url);
      return u.pathname.slice(1);
    } catch {
      return url;
    }
  }
}

module.exports = new StorageService();
