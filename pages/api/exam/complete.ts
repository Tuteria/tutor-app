import { authCheck, defaultView } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";
import { createOrUpdateSubjectWithFlaggedQuestion } from "@tuteria/tuteria-data/src";

export default authCheck(
  async (req, userInfo) => {
    // export default defaultView(
    //   async (req) => {
    // let { userInfo, ...rest } = req.body;
    let result = await serverAdapter.completeQuiz({
      email: userInfo.personalInfo.email,
      // ...rest,
      ...req.body,
    });
    return result.testsTaken;
  },
  {
    method: "POST",
    afterResponse: async (req) => {
      let { flagged = [], ...rest } = req.body;
      for (let u = 0; u < flagged.length; u++) {
        await createOrUpdateSubjectWithFlaggedQuestion(flagged[u]);
      }
    },
  }
);
