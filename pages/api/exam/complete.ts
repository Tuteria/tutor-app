import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    return await serverAdapter.completeQuiz({
      email: userInfo.personalInfo.email,
      ...req.body,
    });
  },
  { method: "POST" }
);
