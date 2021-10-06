import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    return await serverAdapter.generateQuizzes(req.body);
    // return await serverAdapter.generateQuizes(req.body);
  },
  { method: "POST" }
);
