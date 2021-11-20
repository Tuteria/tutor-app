import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    const { text, other_texts } = req.body;
    return await serverAdapter.spellCheck(text, other_texts);
  },
  { method: "POST" }
);
