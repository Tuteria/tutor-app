import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    const { text, other_texts, checks, parse } = req.body;
    if (checks) {
      return await serverAdapter.bulkSpellChecker(checks);
    } else {
      return await serverAdapter.spellCheck(
        text,
        other_texts,
        undefined,
        parse
      );
    }
  },
  { method: "POST" }
);
