import formidable, { Fields, File, Files } from "formidable";
import fs from "fs";
import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

let tempFiles: File[] = [];

export default authCheck(
  async (req, userInfo) => {
    const form = formidable({
      multiples: true,
      uploadDir: "./public",
      keepExtensions: true,
    });
    const { fields, files }: { files: Files; fields: Fields } =
      await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
          } else {
            resolve({ fields, files });
          }
        });
      });
    tempFiles = tempFiles.concat(files.media);
    const options: any = { folder: fields.folder as string, kind: fields.kind };
    if (fields.publicId) {
      options.public_id = fields.publicId as string;
    }
    let quality_check = false;
    if (fields.quality_check === "true") {
      quality_check = true;
    }
    let face_check = false;
    if (fields.face_check === "true") {
      face_check = true;
    }
    const transform = fields.transform
      ? fields.transform.includes("true".toLowerCase())
      : false;
    // const fileIsToBig = tempFiles.some((o) => o.size > 10 * 1048576);
    // if (fileIsToBig && tempFiles.length > 0){
    //   throw "File uploaded should be less that 10MB"
    // }
    const data = await serverAdapter.uploadMedia(
      tempFiles,
      options,
      transform,
      quality_check,
      face_check
    );
    return data;
  },
  {
    method: "POST",
    afterResponse: async () => {
      console.log(tempFiles.map(o=>o.path))
      await Promise.all(tempFiles.map(({ path }) => fs.promises.unlink(path)));
      tempFiles = []
    },
  }
);

export const config = {
  api: {
    bodyParser: false,
  },
};
