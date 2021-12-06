import { defaultView } from "../../middlewares";
import { serverAdapter } from "../../server_utils/server";
import { HOST } from '../../server_utils/hostService';

export default defaultView(
  async (req) => {
    const { email, code } = req.body;
    let data;
    if (email && code) {
      data = await serverAdapter.authenticateUserCode(email, code);
      if (data.tutorData.application_status === 'VERIFIED') {
        const { pk, slug } = data.tutorData;
        data.redirectUrl = `${HOST}/users/authenticate/${pk}/${slug}`; 
      }
    } else {
      data = await serverAdapter.loginUser(email);
    }
    return data;
  },
  { method: "POST" }
);
