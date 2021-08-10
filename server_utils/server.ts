import { getTutorInfoService, saveTutorInfoService } from "./hostService";

const saveTutorInfo = async (data: any) => {
  return await saveTutorInfoService(data);
};

const getTutorInfo = async (tutorId: string) => {
  return await getTutorInfoService(tutorId);
};

export const serverAdapter = {
    saveTutorInfo,
    getTutorInfo
}
