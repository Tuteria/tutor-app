import { appConstants } from "@tuteria/tuteria-data/src/tutor-data";
import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let result = await serverAdapter.validatePersonalInfo(req.body, userInfo.personalInfo);
    return result
  },
  { method: "POST" }
);
