import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let { payload, subject_data } = req.body;
    let result = await serverAdapter.startQuiz({
      email: userInfo.personalInfo.email,
      subjects: payload.subjects,
    });
    await serverAdapter.saveTutorSubjectDetails(subject_data);
    return result;
  },
  { method: "POST" }
);
