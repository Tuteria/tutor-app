import { v2, UploadApiOptions } from "cloudinary";

const cloudinary = v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


export function upload(filePath: string, options: UploadApiOptions) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { resource_type: 'auto', quality_analysis: true, ...options }, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    })
  })
}

export function destroy(publicId: string, options: UploadApiOptions) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'auto', ...options}, (err, result) => {
      if (err) { reject(err) }
      else { resolve(result) }
    });
  })
}