import jwt from 'jsonwebtoken';
import {
  beginQuiz,
  bulkCreateQuizOnBackend,
  fetchAllowedQuizesForUser,
  getQuizData,
  authenticateLoginDetails,
  getTutorInfoService,
  saveTutorInfoService,
  saveTutorSubjectService,
  sendEmailNotification,
  updateTestStatus,
} from "./hostService";
import {
  getTuteriaSubjectList,
  getSheetTestData,
  getTestableSubjects,
} from "./sheetService";
import { groupBy } from "lodash";
import { sendClientLoginCodes } from './email';

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
  // completeQuiz: async (data: {
  async completeQuiz(data: {
    email: string;
    name: string;
    avg_passmark: number;
    time_elapsed: boolean;
    subjects: string[];
    answers: Array<{ question_id: number; answer: number }>;
    question_count: number;
  }) {
    // }) => {
    let quizzes = await apiCallTogetQuiz(data.subjects); // you would implement this
    // also take notes of the type change.
    const grading = this.gradeQuiz(quizzes, data.answers, data.question_count);
    const groupedGrading: {
      email: string;
      name?: string;
      passed: any[];
      failed: any[];
    } = {
      email: data.email,
      passed: [],
      failed: [],
    };
    if (grading.passed) {
      groupedGrading.name = data.name;
    }
    grading.result.forEach(({ passed, score, skill }) => {
      if (passed) {
        groupedGrading.passed.push({ score, skill });
      } else {
        groupedGrading.failed.push({ score, skill });
      }
    });
    return await updateTestStatus(groupedGrading);
  },
  gradeQuiz(
    quizzes: Array<{ skill: string; questions: Array<any>; pass_mark: number }>,
    answers: Array<{ question_id: string; answer: number }>,
    question_count: number
  ): {
    passed: boolean;
    avgPassmark: number;
    totalQuizGrade: number;
    result: Array<{
      score: number;
      passed: boolean;
      pass_mark: number;
      skill: string;
    }>;
  } {
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

  async sendNotification(data, kind = "email") {
    if (kind == "email") {
      await sendEmailNotification(data);
    }
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
  },

  async saveTutorSubject(payload: any) {
    const data = await saveTutorSubjectService(payload);
    return data;
  }
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
