import fs from 'fs';
import formidable, { Files, File, Fields } from "formidable";
import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";
import { UploadApiOptions } from 'cloudinary';

let tempFiles: File[] = [];

export default authCheck(
  async (req, userInfo) => {
    const form = formidable({ multiples: true, uploadDir: './public', keepExtensions: true });
    const { fields, files }: { files: Files, fields: Fields } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });
    tempFiles = tempFiles.concat(files.media);
    const options: UploadApiOptions = { folder: fields.folder as string };
    if (JSON.parse(fields.unique as string)) {
      options.public_id = userInfo.slug;
    }
    const data = await serverAdapter.uploadMedia(tempFiles, options);
    return data;
  },
  {
    method: "POST",
    afterResponse: async () => {
      Promise.all(tempFiles.map(({ path }) => fs.promises.unlink(path)));
    }
  }
);

export const config = {
  api: {
    bodyParser: false,
  }
}