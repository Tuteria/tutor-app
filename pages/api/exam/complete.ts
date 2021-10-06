import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let result = await serverAdapter.completeQuiz({
      email: userInfo.personalInfo.email,
      ...req.body,
    });
    return result.testsTaken;
  },
  { method: "POST" }
);
