import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    const response = await serverAdapter.retakeQuiz({
      email: userInfo.personalInfo.email,
      subjects: req.body.subjects,
    });
    return response;
  },
  { method: "POST" }
);
