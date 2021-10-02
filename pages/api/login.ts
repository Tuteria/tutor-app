import { NextApiRequest, NextApiResponse } from 'next';
import { serverAdapter } from '../../server_utils/server';

export default async function(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, code } = req.body;
      let data;
      if (email && code) {
        const userInfo = await serverAdapter.authenticateUserCode(email, code);
        const access_token = await serverAdapter.upgradeAccessToken(userInfo)
        data = {access_token}
      } else {
        data = await serverAdapter.loginUser(email);
      }
      res.json({ status: true, data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: false, error: error?.message });
    }
  } else {
    res.status(405).json({ msg: "Not Allowed Method" });
  }
}