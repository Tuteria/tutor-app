import { authCheck } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";
// to use this middleware, you just need to return the result of the response
// if there is an error, ensure that it is thrown with the error message to be displayed
export default authCheck(
  async (req, userInfo) => {
    const includeSubjects = req.query.subjects === "true";
    let [clientIp, result] = await Promise.all([
      serverAdapter.getIpFromRequest(req),
      serverAdapter.getTutorDetails(
        userInfo.personalInfo.email,
        includeSubjects,
        true
      ),
    ]);
    if (!result.tutorData?.personalInfo?.locationCountry) {
      result.tutorData.personalInfo.locationCountry = clientIp.country;
    }
    if (!result.tutorData?.personalInfo?.country) {
      result.tutorData.personalInfo.country = clientIp.country;
    }    if (!result.tutorData?.personalInfo?.country_code) {
      result.tutorData.personalInfo.country_code = clientIp.country_code;
    }
    
    return result;
  },
  // this is only used when testing the apis.
  {
    method: "GET",
  }
);
