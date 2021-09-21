/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../../server_utils/server";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    let { answers, quizzes, question_count = 30 } = req.body;
    try {
      let result = serverAdapter.gradeQuiz(quizzes, answers, question_count);
      res.status(200).json({
        status: true,
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error });
    }
  } else {
    res.status(405).json({ msg: "Not Allowed Method" });
  }
};
