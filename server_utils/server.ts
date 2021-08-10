import { getTutorInfoService, saveTutorInfoService } from "./hostService";

export const saveTutorInfo = async (data: any) => {
  return await saveTutorInfoService(data);
};

export const getTutorInfo = async (tutorId: string) => {
  return await getTutorInfoService(tutorId);
};
