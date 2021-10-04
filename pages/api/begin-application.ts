import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";

type Response = {
  accessToken?: string;
  redirectUrl: string;
}

export default defaultView(async (req) => {
  const { token, email } = req.body;
  const response: Response = { redirectUrl: '/application' };
  const user = serverAdapter.getUserInfo(token);

  if (user && user.personalInfo.email === email) {
    const data = await serverAdapter.getTutorInfo(email);
    response.accessToken = serverAdapter.upgradeAccessToken(data);
  } else {
    const { accessToken } = await serverAdapter.loginUser(email as string);
    if (accessToken) {
      response.accessToken = accessToken;
    } else {
      response.redirectUrl = `login?email=${email}&next=/application`;
    }
  }
  return response;
}, { method: "POST" });
