import formidable from "formidable";
import path from 'path';
import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

// to use this middleware, you just need to return the result of the response
// if there is an error, ensure that it is thrown with the error message to be displayed
export default authCheck(
  async (req, userInfo) => {
    const form = formidable({ multiples: true, uploadDir: './public' });
    const { fields, files } = await new Promise((resolve, reject) => {  
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });
    const options: any = { folder: fields.folder };
    if (JSON.parse(fields.unique)) {
      options.public_id = userInfo.slug;
    }
    let data: any;
    if (Array.isArray(files.media)) {
      data = await Promise.all(files.media.map(({ path }) => serverAdapter.uploadMedia(path, options)));
    } else {
      data = await serverAdapter.uploadMedia([files.media], options);
    }
    return data;
  },
  // this is only used when testing the apis.
  { method: "POST" }
);

export const config = {
  api: {
    bodyParser: false,
  }
}