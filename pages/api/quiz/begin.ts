import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default authCheck(
  async (req, userInfo) => {
    let { payload, subject_data } = req.body;
    let result = await Promise.all([
      serverAdapter.startQuiz({
        email: userInfo.personalInfo.email,
        subjects: payload.subjects,
      }),
      serverAdapter.saveTutorSubjectDetails(subject_data),
    ]);
    return result[0];
  },
  { method: "POST" }
);
