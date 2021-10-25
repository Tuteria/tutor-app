import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";

type Response = {
  accessToken?: string;
  redirectUrl: string;
};

export default defaultView(
  async (req) => {
    const { token, email } = req.body;
    const response: Response = { redirectUrl: "/apply" };
    const user = serverAdapter.getUserInfo(token);
    let process = true;
    if (user && user.personalInfo?.email === email) {
      try {
        process = false;
        const data = await serverAdapter.getTutorInfo(email); // this might fail if email has been deleted.
        response.accessToken = serverAdapter.upgradeAccessToken(data);
      } catch (error) {
        process = true;
        console.log(error);
      }
    }
    if (process) {
      const { accessToken } = await serverAdapter.loginUser(email as string);
      if (accessToken) {
        response.accessToken = accessToken;
      } else {
        response.redirectUrl = `login?email=${email}&next=/apply`;
      }
    }

    return response;
  },
  { method: "POST" }
);
