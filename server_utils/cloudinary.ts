import XFormDAta from "form-data";
import fs from "fs";
import fetch from "node-fetch";
import { getCloudinaryDetails } from "@tuteria/tuteria-data/src";
// const MEDIA_SERVICE = process.env.MEDIA_SERVICE || "http://localhost:8000";
// const MEDIA_SERVICE = process.env.MEDIA_SERVICE || "http://dev.tuteria.com:8020";
// process.env.MEDIA_SERVICE || "http://staging-prod.tuteria.com:8020";
const MEDIA_SERVICE = process.env.MEDIA_SERVICE || "http://dev.tuteria.com:8020";
const MEDIA_FORMAT = process.env.MEDIA_FORMAT || "test";

async function transformImage(publicId: string, serverConfig) {
  const url = await getCloudinaryUrl(publicId, {
    gravity: "face",
    width: 150,
    height: 150,
    crop: "fill",
    fetch_format: "auto",
    quality: "auto",
    kind: "image",
  }, serverConfig);
  return url;
}

export async function upload(filePath: any, options: any, transform: boolean) {
  let new_options = { ...options, file_name: options.public_id };
  delete new_options.public_id;
  const serverConfig = await getCloudinaryDetails(MEDIA_FORMAT);
  let result = await uploadCloudinaryResource(
    filePath,
    new_options,
    options.kind as any,
    JSON.stringify(serverConfig),
  );
  if (result.full_response) {
    let r = result.full_response;
    const quality = r.quality_analysis?.focus >= 0.8;
    let response = {
      public_id: r.public_id,
      bytes: r.bytes,
      url: r.secure_url,
      quality: quality,
    };
    if (transform) {
      response.url = await transformImage(r.public_id, serverConfig);
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

export async function destroy({ id, kind = "image" }) {
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/delete`, {
    method: "POST",
    body: JSON.stringify({ public_id: id, kind }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status < 400) {
    let result = await response.json();
    return result.data;
  }
  throw "Error from server";
}

export async function getCloudinaryUrl(public_id: string, options = {}, serverConfig: any) {
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/get_url`, {
    method: "POST",
    body: JSON.stringify({
      public_id,
      server_config: serverConfig,
      ...options
    }),
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
  kind: UploadTypes = "image",
  serverConfig?: string,
) {
  let formData = new XFormDAta();

  Object.keys(options).forEach((key) => {
    if (options[key]) {
      formData.append(key, options[key]);
    }
  });
  formData.append(kind, fs.createReadStream(fileObj.path));
  formData.append("kind", kind);
  if (serverConfig) {
    formData.append("server_config", serverConfig);
  }

  console.log(options);
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/upload`, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });
  if (response.ok) {
    let result = await response.json();
    if (response.status < 400) {
      return result.data;
    }
    return result;
  }
  console.log(response);
  throw "Error from server";
}
