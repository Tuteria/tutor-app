import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";
// to use this middleware, you just need to return the result of the response
// if there is an error, ensure that it is thrown with the error message to be displayed
export default authCheck(
  async (req, userInfo) => {
    const includeSubjects = req.query.subjects === "true";
    return await serverAdapter.getTutorDetails(
      userInfo.personalInfo.email,
      includeSubjects,
      true
    );
  },
  // this is only used when testing the apis.
  {
    method: "GET",
  }
);
