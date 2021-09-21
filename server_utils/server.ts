import {
  beginQuiz,
  bulkCreateQuizOnBackend,
  fetchAllowedQuizesForUser,
  getQuizData,
  getTutorInfoService,
  saveTutorInfoService,
} from "./hostService";
import {
  getTuteriaSubjectList,
  getSheetTestData,
  getTestableSubjects,
} from "./sheetService";

const bulkFetchQuizSubjectsFromSheet = async (
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
};

const transfromData = (data, showAnswer = false) =>
  data.map((item) => ({
    id: item.id,
    pretext: item.pretext,
    content: item.content,
    figure: item.image,
    is_latex: item.is_latex || false,
    comprehension: {
      passage: item.comprehension,
    },
    options_display: item.options_layout || "vertical",
    answers: item.answer_set.map((option) => {
      const optionData = {
        content: option.content,
        is_latex: item.is_latex || false,
        figure: null,
        answer_type: "TEXT",
      };
      return showAnswer
        ? { ...optionData, correct: showAnswer ? option.correct : null }
        : optionData;
    }),
  }));

const getQuizQuestions = async (subject: string) => {
  const questions = await getQuizData(subject);
  return transfromData(questions);
};

export const serverAdapter = {
  bulkFetchQuizSubjectsFromSheet,
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
  generateQuizes: async (name: string, subjects: string[]) => {
    const quizDataFromSheet: any[] = await bulkFetchQuizSubjectsFromSheet(
      subjects,
      true
    );
    const quizQuestionpromises = quizDataFromSheet.map((item) =>
      getQuizQuestions(item.quiz_url)
    );
    const quizQuestions = await Promise.all(quizQuestionpromises);
    return subjects.map((subject, index) => ({
      subject,
      passmark: quizDataFromSheet[index].passmark,
      questions: quizQuestions[index],
    }));
  },
  startQuiz: async (subjects: []) => {
    const response = await beginQuiz(subjects)
    return response;
  }
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
