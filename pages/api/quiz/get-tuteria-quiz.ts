import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let result = await serverAdapter.getTuteriaSubjectList(
      userInfo.personalInfo.email
    );
    return result;
  },
  { method: "POST" }
);
