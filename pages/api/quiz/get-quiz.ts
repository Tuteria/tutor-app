import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let { subjects, create = false } = req.body;
    let result = await serverAdapter.bulkFetchQuizSubjectsFromSheet(
      subjects,
      create
    );
    return result;
  },
  { method: "POST" }
);
