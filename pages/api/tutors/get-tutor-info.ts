import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";
// to use this middleware, you just need to return the result of the response
// if there is an error, ensure that it is thrown with the error message to be displayed
export default authCheck(
  async (req, userInfo) => {
    const [tutorData, tutorSubjects] = await Promise.all([
      serverAdapter.getTutorInfo(userInfo.personalInfo.email),
      serverAdapter.getTutorSubjects(userInfo.personalInfo.email),
    ]);
    const accessToken = serverAdapter.upgradeAccessToken(tutorData);
    return { accessToken, tutorData, tutorSubjects: tutorSubjects.skills }
  },
  // this is only used when testing the apis.
  {
    method: "GET",
  }
);
