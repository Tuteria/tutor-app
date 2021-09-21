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
import { groupBy } from "lodash";

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
  gradeQuiz(
    quizzes: Array<{ skill: string; questions: Array<any>; pass_mark: number }>,
    answers: Array<{ question_id: string; answer: number }>,
    question_count: number
  ) {
    /**This function is an internal function, you would need to make api calls to get 
     * the quiz data.
     */
    let avgPassmark = sum(quizzes.map((o) => o.pass_mark)) / quizzes.length;
    // group the answers into their corresponding quizes
    let combinedQuestions = quizzes
      .map((quiz) => {
        return quiz.questions.map((o) => ({ ...o, skill: quiz.skill }));
      })
      .flat();
    let transformedAnswers = answers.map((a) => {
      let found = combinedQuestions.find((o) => o.id === a.question_id);
      let isCorrect = false;
      let skill = null;
      if (found) {
        isCorrect = found.answers[a.answer].correct === true;
        skill = found.skill;
      }
      return { ...a, correct: isCorrect, skill };
    });
    let passedQuizAvg =
      (transformedAnswers.filter((o) => o.correct).length * 100) /
      question_count;
    let graded = groupBy(transformedAnswers, "skill");
    let result = {};
    Object.keys(graded).forEach((gr) => {
      let key = gr;
      let quizInstance = quizzes.find((o) => o.skill === gr);
      let value = graded[gr];
      let score = (value.filter((o) => o.correct).length * 100) / value.length;

      result[key] = {
        score,
        passed: score > quizInstance.pass_mark,
        pass_mark: quizInstance.pass_mark,
      };
    });
    return {
      avgPassmark,
      totalQuizGrade: passedQuizAvg,
      result: Object.keys(result).map((o) => ({ ...result[o], skill: o })),
      passed: passedQuizAvg > avgPassmark,
    };
  },
  // async gradeQuiz(
  //   answers: Array<{ question_id: string; answer: string }>,
  //   subjects: string[]
  // ) {
  //   // using the subjects array passed, get the list of all
  //   return {};
  // },
};

function sum(array: number[]) {
  return array.reduce((a, b) => a + b, 0);
}
