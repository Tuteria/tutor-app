import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";
import { HOST } from "../../server_utils/hostService";

export default defaultView(
  async (req) => {
    const { email, code, telegram_id } = req.body;
    const user = req.headers["x-user"];
    if (user && user === "admin"){
      return serverAdapter.getTutorDetails(email, true, true, null)
    }
    let data;
    if (telegram_id) {
      data = await serverAdapter.authenticateUserTelegram(telegram_id);
    } else {
      if (email && code) {
        data = await serverAdapter.authenticateUserCode(email, code);
        if (data.tutorData.application_status === "VERIFIED") {
          const { pk, slug } = data.tutorData;
          data.redirectUrl = `${HOST}/users/authenticate/${pk}/${slug}?redirect_url=/dashboard/`;
        } else if (data.tutorData.application_status === "DENIED") {
          data.redirectUrl = "/?denied=true";
        }
      } else {
        data = await serverAdapter.loginUser(email);
      }
    }
    return data;
  },
  { method: "POST" }
);
