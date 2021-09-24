import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../server_utils/server";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let authorization = req.headers["authorization"];
  if (!authorization) {
    res.status(400).json({ error: "Missing authorization header" });
  } else {
    if (req.method === "POST") {
      try {
        let userInfo = serverAdapter.getUserInfo(authorization);
        if (userInfo) {
          const response = await serverAdapter.selectSubjects({
            email: userInfo.personalInfo.email,
            subjects: req.body.subjects,
          });
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
