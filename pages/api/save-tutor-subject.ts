import { NextApiRequest, NextApiResponse } from 'next';
import { serverAdapter } from '../../server_utils/server';

export default async function(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = await serverAdapter.saveTutorSubject(req.body);
      res.json({status: true, data });
    } catch(error) {
      console.error(error);
      res.status(400).json({ status: false, error: error.message })
    }
  } else {
    res.status(405).json({ status: false, msg: "Method Not Allowed" });
  }
}
