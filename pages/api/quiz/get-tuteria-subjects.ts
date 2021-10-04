import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let result = await serverAdapter.getTuteriaSubjects(
      req.body.subject
    );
    return result;
  },
  { method: "POST" }
);
