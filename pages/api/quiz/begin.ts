import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    return await serverAdapter.startQuiz({
      email: userInfo.personalInfo.email,
      subjects: req.body.subjects,
    });
  },
  { method: "POST" }
);
