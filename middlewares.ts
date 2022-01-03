import { NextApiRequest, NextApiResponse } from "next";
import { getUserInfo, serverAdapter } from "./server_utils/server";
import { withSentry } from '@sentry/nextjs';

export const defaultView = (
  handler: (
    _req?: NextApiRequest,
    _res?: NextApiResponse,
    method?: string
  ) => Promise<any>,
  options: {
    force_verify?: boolean;
    method?: string;
    includeToken?: string;
    afterResponse?: any;
  } = { method: "POST" }
) => {
  const handlers = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === options.method) {
      try {
        let response = await handler(req, res);
        res.json({ status: true, data: response });
      } catch (error) {
        console.log(error);
        res.status(400).json({ status: false, error });
      }
    } else {
      res.status(405).json({ msg: "Not Allowed Method" });
    }
  }
  return withSentry(handlers);
};

export const authCheck = (
  handler: (
    req: NextApiRequest,
    userInfo: { slug: string, personalInfo: { email: string } },
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
        try {
          let response = await handler(req, userInfo);
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
        }
      } else {
        res.status(403).json({ error: "Could not load token" });
      }
    } else {
      res.status(405).json({ msg: "Not Allowed Method" });
    }
  }
  return withSentry(handlers);
};
