import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    return await serverAdapter.saveTutorSubjectDetails(req.body);
  },
  { method: "POST" }
);
