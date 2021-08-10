import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../server_utils/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const result = await serverAdapter.saveTutorInfo(req.body);
      res.status(200).json({ status: true, data: result });
    } catch (error) {
      res.status(400).json({ status: false, error });
    }
  } else {
    res.status(405).json({ status: false, msg: "Method Not Allowed" });
  }
}
