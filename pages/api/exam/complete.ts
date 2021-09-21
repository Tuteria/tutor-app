import { NextApiRequest, NextApiResponse } from "next";
import { serverAdapter } from "../../../server_utils/server";

export default async (req:NextApiRequest, res: NextApiResponse) => {
    if (req.method === "POST") {
        try {
            const response = await serverAdapter.completeQuiz(req.body);
        } catch (error) {
            res.status(400).json({status: false,  error})
        }
    } else {
        res.status(405).json({msg: "Mot Allowwed Methods"})
    }
}