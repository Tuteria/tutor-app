import jwt from 'jsonwebtoken';
import {
  authenticateLoginDetails,
  getTutorInfoService,
  saveTutorInfoService,
  sendEmailNotification,
} from "./hostService";
import { sendClientLoginCodes } from './email';

export const serverAdapter = {
  async sendNotification(data, kind = "email") {
    if (kind == "email") {
      await sendEmailNotification(data);
    }
  },

  async saveTutorInfo(data: any) {
    return await saveTutorInfoService(data);
  },

  async getTutorInfo(tutorId: string) {
    return await getTutorInfoService(tutorId);
  },

  async upgradeAccessToken(userInfo) {
    return jwt.sign(userInfo, process.env.SECRET_KEY, {
      expiresIn: 60 * 60 * 24
    });
  },

  async authenticateUserCode(email: string, code: string) {
    const data = await authenticateLoginDetails({ email, code });
    return data;
  },

  async loginUser(email: string) {
    const data = await authenticateLoginDetails({ email });
    const payload = sendClientLoginCodes(email, data.code);
    await this.sendNotification(payload);
    return { email: data.email };
  }
};