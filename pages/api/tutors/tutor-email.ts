import { defaultView } from "../../../middlewares";
import {
  TUTOR_APPLICATION_STEPS,
  processTutorApplicationStepEmail,
} from "../../../server_utils/tutor-email";
import { serverAdapter } from "../../../server_utils/server";

type reqBody = {
  action: TUTOR_APPLICATION_STEPS;
  data: {
    email: string;
    [key: string]: any;
  };
};
export default defaultView(
  async (req) => {
    const { action, data }: reqBody = req.body;
    return await processTutorApplicationStepEmail(action, data);
  },
  { method: "POST" }
);
