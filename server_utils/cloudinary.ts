import XFormDAta from "form-data";
import fs from "fs";
import fetch from "node-fetch";
import { getCloudinaryDetails } from "@tuteria/tuteria-data/src";
// const MEDIA_SERVICE = process.env.MEDIA_SERVICE || "http://localhost:8000";
// const MEDIA_SERVICE = process.env.MEDIA_SERVICE || "http://dev.tuteria.com:8020";
// process.env.MEDIA_SERVICE || "http://staging-prod.tuteria.com:8020";
const MEDIA_SERVICE =
  process.env.MEDIA_SERVICE || "http://dev.tuteria.com:8020";
const MEDIA_FORMAT = process.env.MEDIA_FORMAT || "test";

async function transformImage(publicId: string, serverConfig) {
  const url = await getCloudinaryUrl(
    publicId,
    {
      gravity: "face",
      width: 300,
      height: 300,
      crop: "fill",
      fetch_format: "auto",
      quality: "auto",
      kind: "image",
    },
    serverConfig
  );
  return url;
}

export async function upload(
  filePath: any,
  options: any,
  transform: boolean,
  quality_check = false,
  face_check = false
) {
  let new_options = { ...options, file_name: options.public_id };
  delete new_options.public_id;
  const serverConfig = await getCloudinaryDetails(MEDIA_FORMAT);
  let checks: any = {};
  if (quality_check) {
    checks.quality_analysis = 1;
  }
  if (face_check) {
    checks.detection = "google_face_check";
  }
  if (Object.keys(checks).length > 0) {
    checks = JSON.stringify(checks);
  } else {
    checks = null;
  }
  let result = await uploadCloudinaryResource(
    filePath,
    new_options,
    options.kind as any,
    JSON.stringify(serverConfig),
    checks
  );
  if (result.full_response) {
    let r = result.full_response;

    let response: any = {
      public_id: r.public_id,
      bytes: r.bytes,
      url: r.secure_url,
    };
    if (r.quality_analysis?.focus) {
      const quality = r.quality_analysis?.focus >= 0.1;
      response.quality = quality;
    }
    if (r.vision_ai) {
      let hasFace = r.vision_ai.faces_detected > 0;
      response.has_face = hasFace;
    }
    console.log(JSON.stringify(r));
    // if (transform) {
    //   response.url = await transformImage(r.public_id, serverConfig);
    // }
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
  const serverConfig = await getCloudinaryDetails(MEDIA_FORMAT);
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/delete`, {
    method: "POST",
    body: JSON.stringify({ public_id: id, kind,server_config: serverConfig }),
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

export async function getCloudinaryUrl(
  public_id: string,
  options = {},
  serverConfig: any
) {
  let response = await fetch(`${MEDIA_SERVICE}/media/${MEDIA_FORMAT}/get_url`, {
    method: "POST",
    body: JSON.stringify({
      public_id,
      server_config: serverConfig,
      ...options,
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
  checks?: any
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
  if (checks) {
    formData.append("checks", checks);
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
