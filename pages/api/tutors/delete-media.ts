import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    const { id } = req.body;
    return await serverAdapter.deleteMedia({ id });
  },
  { method: "POST" }
);
