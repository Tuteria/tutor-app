import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";

export default defaultView(
  async (req) => {
    const { email, code } = req.body;
    let data;
    if (email && code) {
      data = await serverAdapter.authenticateUserCode(email, code);
      // const access_token = serverAdapter.upgradeAccessToken(userInfo);
      // data = { access_token };
    } else {
      data = await serverAdapter.loginUser(email);
    }
    return data;
  },
  { method: "POST" }
);
