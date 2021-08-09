import {sampleServerAdapter} from "../../server_utils/server"

export default async function handler(req, res) {
  const result = await sampleServerAdapter()
  res.status(200).json({ name: result });
}
