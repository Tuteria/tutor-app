import { defaultView } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default defaultView(
  async (req) => {
    const response = await serverAdapter.getIpFromRequest(req);
    return response;
  },
  { method: "GET" }
);
