import { uploadView } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default uploadView(
  async (req, fields, tempFiles) => {
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
  }
);

export const config = {
  api: {
    bodyParser: false,
  },
};
