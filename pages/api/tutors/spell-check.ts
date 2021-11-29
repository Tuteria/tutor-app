import { appConstants } from "@tuteria/tuteria-data/src/tutor-data";
import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    const { checks } = req.body;
    const config = await appConstants();
    return await serverAdapter.bulkSpellChecker(checks, config);
  },
  { method: "POST" }
);
