import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../server_utils/server";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const authorization = req.headers["authorization"];
    if (!authorization) {
      res.status(400).json({ error: "Missing authorization header" });
    } else {
      if (req.method === "GET") {
        try {
          let userInfo = serverAdapter.getUserInfo(authorization);
          if (userInfo) {
            const response = await serverAdapter.getTutorSubjects(userInfo.personalInfo.email);
            res.status(200).json({ status: true, data: response });
          } else {
            res.status(400).json({ error: `Could not load token` });
          }
        } catch (error) {
          res.status(400).json({ status: false, error });
        }
      } else {
        res.status(405).json({ msg: "Not Allowed Method" });
      }
    }
  };