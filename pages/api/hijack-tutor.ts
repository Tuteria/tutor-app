import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";

export default defaultView(
  async (req, res) => {
    const { email, accessCode } = req.query
    if (accessCode === "AGENT_ACCESS") {
      const accessToken = await serverAdapter.hijackTutor(email);
      res.writeHead(302, {
        'Location': `/admin?c=${accessToken}`
      })
    } else {
      res.status(400).json({ status: false, error: "Request failed" })
    }

  },
  { method: "GET" }
)