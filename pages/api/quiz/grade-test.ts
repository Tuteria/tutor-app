/* eslint-disable import/no-anonymous-default-export */
import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let { answers, quizzes, question_count = 30 } = req.body;
    let result = serverAdapter.gradeQuiz(quizzes, answers, question_count);
    return result;
  },
  { method: "POST" }
);
