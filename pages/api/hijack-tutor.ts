import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";

export default defaultView(
  async (req, res) => {
    const { email, accessCode, current_step } = req.query;
    if (accessCode === "TUTOR_SUCCESS_ACCESS") {
      const accessToken = await serverAdapter.hijackTutor(email);
      res.writeHead(302, {
        Location: `/admin?c=${accessToken}&current_step=${current_step}`,
      });
    } else {
      throw "Request failed";
    }
  },
  { method: "GET" }
);
