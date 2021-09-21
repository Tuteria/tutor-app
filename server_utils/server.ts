import {
  beginQuiz,
  bulkCreateQuizOnBackend,
  fetchAllowedQuizesForUser,
  getQuizData,
  getTutorInfoService,
  gradeQuiz,
  saveTutorInfoService,
  updateTestStatus,
} from "./hostService";
import {
  getTuteriaSubjectList,
  getSheetTestData,
  getTestableSubjects,
} from "./sheetService";
import { groupBy } from "lodash";

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
  startQuiz: async (subjects: string[], email: string) => {
    return await beginQuiz(subjects, email);
  },
  completeQuiz: async (data: {
    email: string;
    name: string;
    avg_passmark: number;
    time_elapsed: boolean;
    subjects: string[];
    answers: Array<{ question_id: number; answer: string }>;
  }) => {
    const grading = await gradeQuiz(data);
    const groupedGrading = {
      email: data.email,
      name: data.name,
      passed: [],
      failed: [],
    };
    grading.forEach(({ passed, score, skill }) => {
      if (passed) {
        groupedGrading.passed.push({ score, skill });
      } else {
        groupedGrading.failed.push({ score, skill });
      }
    });
    const result = await updateTestStatus(groupedGrading);
    return result;
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
