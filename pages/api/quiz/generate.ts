import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../../server_utils/server";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    try {
      let quizes = await serverAdapter.generateQuizes(req.body);
      res.status(200).json({ status: true, data: quizes });
    } catch (error) {
      console.log(error)
      res.status(400).json({ status: false, error });
    }
  } else {
    res.status(405).json({ msg: "Not Allowed Method" });
  }
};
