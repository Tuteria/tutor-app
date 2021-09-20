import {
  bulkCreateQuizOnBackend,
  fetchAllowedQuizesForUser,
  getTutorInfoService,
  saveTutorInfoService,
} from "./hostService";
import {
  getTuteriaSubjectList,
  getSheetTestData,
  getTestableSubjects,
} from "./sheetService";

export const serverAdapter = {
  saveTutorInfo: async (data: any) => {
    return await saveTutorInfoService(data);
  },
  getTutorInfo: async (tutorId: string) => {
    return await getTutorInfoService(tutorId);
  },
  getTuteriaSubjectList: async (email: string) => {
    let tuteriaSubjectForTutor = await fetchAllowedQuizesForUser(email);
    let quizGroupings = await getTuteriaSubjectList();
    let names = tuteriaSubjectForTutor.map((x) => x.name);
    let found = quizGroupings
      .filter((a, i) => names.includes(a.name))
      .map((j) => {
        let instance = tuteriaSubjectForTutor.find((o) => o.name === j.name);
        if (instance) {
          return { ...j, subjects: j.subjects.map((o) => o.skill) };
        }
        return j;
      });
    return { found };
  },
  getQuizSheetData: async (subject: string) => {
    let result = await getSheetTestData(subject);
    return result;
  },
  bulkFetchQuizSubjectsFromSheet: async (
    subjects: string[],
    create = false
  ) => {
    let promises: any = await Promise.all(
      subjects.map((o) => getSheetTestData(o))
    );
    // let promises: any = await batchPromiseCall(
    //   subjects.map((o) => getSheetTestData(o), 5)
    // );
    // debugger;
    let transformed = await getTestableSubjects();
    let rr = subjects
      .map((p, i) => {
        let f = transformed.find((o) => o.skill === p);
        if (f) {
          return {
            skill: f.skill,
            pass_mark: f.pass_mark,
            url: f.url,
            questions: promises[i],
          };
        }
        return null;
      })
      .filter((x) => x);
    if (create) {
      return await bulkCreateQuizOnBackend(rr);
    }
    return rr;
  },
};

async function batchPromiseCall(promises: any, size = 10) {
  let r = [];
  if (promises.length > 0) {
    const times = Math.ceil(promises.length / size);
    const batchPromises = [];
    for (let i = 0; i < times; i++) {
      batchPromises.push(promises.splice(0, size));
    }

    for (let i = 0; i < batchPromises.length; i++) {
      setTimeout(async () => {
        let result = await Promise.all(batchPromises[i]);
        r.push(result);
        console.log(result);
      }, 10000);
    }
  }
  return r.flat();
}
