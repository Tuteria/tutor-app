import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";

export default defaultView(
  async (req) => {
    const { country } = req.body;
    const data = await serverAdapter.getBanksSupported(country);
    return data;
  },
  { method: "POST" }
);
