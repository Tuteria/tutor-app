import { v2, UploadApiOptions } from "cloudinary";

const cloudinary = v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


function transformImage(publicId: string) {
  const url = cloudinary.url(publicId, {
    gravity: 'face',
    width: 150,
    height: 150,
    crop: 'fill',
    fetch_format: 'auto',
    quality: 'auto',
  });
  return url;
}

export function upload(filePath: string, options: UploadApiOptions, transform: boolean) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { resource_type: 'auto', quality_analysis: true, ...options }, (err, { bytes, public_id, secure_url, quality_analysis }) => {
      if (err) {
        reject(err);
      } else {
        const quality = quality_analysis?.focus >= 0.5;
        const response = {
          public_id,
          bytes,
          url: secure_url,
          quality,
        }
        if (transform && quality) {
          response.url = transformImage(public_id);
        }
        resolve(response);
      }
    })
  })
}

export function destroy(publicId: string, options: UploadApiOptions) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'auto', ...options }, (err, result) => {
      if (err) { reject(err) }
      else { resolve(result) }
    });
  })
}