import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../../server_utils/server";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      const response = await serverAdapter.getTuteriaSubjects(
        req.query.name as string
      );
      res.status(200).json({ status: true, data: response });
    } catch (error) {
      res.status(400).json({ status: false, error: error.message });
    }
  } else {
    res.status(405).json({ msg: "Not Allowed Method" });
  }
};
