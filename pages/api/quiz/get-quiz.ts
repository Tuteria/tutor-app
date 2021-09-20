import { NextApiRequest, NextApiResponse } from "next";
import { getTestQuestionsForSubject } from "../../../server_utils/quizes";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    let { subject } = req.body;
    try {
      let quizes = await getTestQuestionsForSubject(subject);
      res.status(200).json({
        status: true,
        data: quizes,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error });
    }
  } else {
    res.status(405).json({ msg: "Not Allowed Method" });
  }
};
