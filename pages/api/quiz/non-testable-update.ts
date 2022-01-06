import { defaultView } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default defaultView(
  async (req) => {
    const response = await serverAdapter.updateAllNonTestables();
    return response;
  },
  {
    method: "GET",
    afterResponse: async () => {
      await serverAdapter.updateAllNonTestables(true);
    },
  }
);
