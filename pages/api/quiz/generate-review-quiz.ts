import { defaultView } from "../../../middlewares";
import { serverAdapter } from "../../../server_utils/server";

export default defaultView(
    async (req, userInfo) => {
        return await serverAdapter.generateQuizzes(req.body);
    },
    { method: "POST" }
);
