import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary if credentials are provided
const isConfigured = Boolean(
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ||
  process.env.CLOUDINARY_URL
);

if (isConfigured) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

/**
 * Returns whether Cloudinary is configured with valid environment variables
 */
export function isCloudinaryConfigured() {
  return isConfigured;
}

/**
 * Uploads an image buffer or base64 string to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} mimetype - e.g. 'image/png'
 * @param {object} options - folder, public_id, etc.
 * @returns {Promise<{url: string, publicId?: string, isConfigured: boolean}>}
 */
export async function uploadImageToCloudinary(buffer, mimetype = 'image/png', options = {}) {
  const folder = options.folder || 'cpl_auction/teams';
  const base64Data = `data:${mimetype};base64,${buffer.toString('base64')}`;

  if (!isConfigured) {
    console.warn(
      '[Cloudinary] Notice: Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not set in .env.'
    );
    // Graceful fallback: return data URI so image displays in UI without breaking
    return {
      url: base64Data,
      isConfigured: false,
      message: 'Cloudinary API credentials not set in .env. Stored as direct data URI for immediate testing.',
    };
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ],
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload Error:', error);
          return reject(new Error(error.message || 'Cloudinary upload failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          isConfigured: true,
        });
      }
    );
  });
}
