import { NextApiRequest, NextApiResponse } from "next";
import { getUserInfo, serverAdapter } from "../server_utils/server";
import { withSentry } from "@sentry/nextjs";
import formidable, { Fields, File, Files } from "formidable";
import fs from "fs";

export const uploadView = (
  handler: (
    req: NextApiRequest,
    fields: any,
    tempFiles: File[],
    method?: string
  ) => Promise<any>,
  options: {
    force_verify?: boolean;
    method?: string;
    includeToken?: string;
    afterResponse?: any;
  } = { method: "POST" }
) => {
  let force_verify =
    (serverAdapter.apiTest ? false : true) || options.force_verify;
  const handlers = async (req: NextApiRequest, res: NextApiResponse) => {
    let userInfo;
    if (req.method === options.method) {
      const authorization = req.headers["authorization"];
      if (!authorization) {
        res.status(400).json({ error: "Missing authorization header" });
        return;
      } else {
        // use this opportunity to decode the authorization token
        try {
          userInfo = getUserInfo(authorization, force_verify);
        } catch (error) {
          console.log("ERROR decoding token ", error);
          userInfo = null;
        }
      }
      if (userInfo) {
        let tempFiles: File[] = [];
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
        try {
          let response = await handler(req, fields, tempFiles);
          if (options.includeToken) {
            response[options.includeToken] =
              serverAdapter.upgradeAccessToken(response);
          }
          res.status(200).json({ status: true, data: response });
          if (options.afterResponse) {
            await options.afterResponse(req);
          }
        } catch (error) {
          console.log(error);
          res.status(400).json({ status: false, error });
          if (options.afterResponse) {
            await options.afterResponse(req);
          }
        } finally {
          console.log(tempFiles.map((o) => o.path));
          await Promise.all(
            tempFiles.map(({ path }) => fs.promises.unlink(path))
          );
          // ensure the file is deleted
          console.log("Deleted file is ", tempFiles);
        }
      } else {
        res.status(403).json({ error: "Could not load token" });
      }
    } else {
      res.status(405).json({ msg: "Not Allowed Method" });
    }
  };
  return withSentry(handlers);
};
