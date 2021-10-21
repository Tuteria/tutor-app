import XFormDAta from "form-data";
import fs from "fs";
import fetch from "node-fetch";
const MEDIA_SERVICE = process.env.MEDIA_SERVICE || "https://sheet.tuteria.com";
const MEDIA_FORMAT = process.env.MEDIA_FORMAT || "test";

async function transformImage(publicId: string) {
  const url = await getCloudinaryUrl(publicId, {
    gravity: "face",
    width: 150,
    height: 150,
    crop: "fill",
    fetch_format: "auto",
    quality: "auto",
    kind: "image",
  });
  return url;
}

export async function upload(filePath: any, options: any, transform: boolean) {
  let result = await uploadCloudinaryResource(
    filePath,
    { ...options, file_name: options.public_id },
    options.kind as any
  );
  if (result.full_response) {
    let r = result.full_response;
    const quality = r.quality_analysis?.focus >= 0.5;
    let response = {
      public_id: r.public_id,
      bytes: r.bytes,
      url: r.secure_url,
      quality: quality,
    };
    if (transform) {
      response.url = await transformImage(r.public_id);
    }
    return response;
  }
  throw "Error saving to cloudinary";
}

// export function destroy(publicId: string, options: UploadApiOptions) {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.destroy(
//       publicId,
//       { resource_type: "auto", ...options },
//       (err, result) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(result);
//         }
//       }
//     );
//   });
// }

export async function getCloudinaryUrl(public_id, options = {}) {
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/get_url`, {
    method: "POST",
    body: JSON.stringify({ public_id, ...options }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status < 400) {
    let result = await response.json();
    return result.data;
  }
}

export type UploadTypes = "image" | "video" | "raw";

export async function uploadCloudinaryResource(
  fileObj: any,
  options: any,
  kind: UploadTypes = "image"
) {
  let formData = new XFormDAta();
  Object.keys(options).forEach((key) => {
    formData.append(key, options[key]);
  });
  formData.append(kind, fs.createReadStream(fileObj.path));
  formData.append("kind", kind);
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/upload`, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });
  let result = await response.json();
  if (response.status < 400) {
    return result.data;
  }
  return result;
}
