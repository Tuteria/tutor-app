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
    const transform = fields.transform
      ? fields.transform.includes("true".toLowerCase())
      : false;
    const data = await serverAdapter.uploadMedia(tempFiles, options, transform);
    return data;
  },
  {
    method: "POST",
    afterResponse: async () => {
      Promise.all(tempFiles.map(({ path }) => fs.promises.unlink(path)));
    },
  }
);

export const config = {
  api: {
    bodyParser: false,
  },
};
