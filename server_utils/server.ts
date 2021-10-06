import jwt from "jsonwebtoken";
import {
  beginQuiz,
  bulkCreateQuizOnBackend,
  fetchAllowedQuizesForUser,
  getQuizData,
  authenticateLoginDetails,
  saveTutorInfoService,
  saveTutorSubjectService,
  sendEmailNotification,
  saveUserSelectedSubjects,
  updateTestStatus,
  userRetakeTest,
  fetchAllCountries,
  API_TEST,
} from "./hostService";
import {
  getTuteriaSubjectList,
  getSheetTestData,
  getTestableSubjects,
  getTuteriaSubjectData,
  getQuizzesFromSubjects,
  getLocationInfoFromSheet,
} from "./sheetService";
import { groupBy } from "lodash";
import { sendClientLoginCodes } from "./email";

export type TuteriaSubjectType = {
  slug: string;
  name: string;
  subjects: Array<{
    name: string;
    url: string;
    test_name: string;
    pass_mark: number;
  }>;
  category?: string;
  subcategory?: string;
};

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

type QuizDataType = {
  skill: string;
  url: string;
  pass_mark: number;
  questions: any;
};

type SavedQuizDataType = {
  name: string;
  testable: boolean;
  quiz_url: string;
  id: number;
  slug: string;
  passmark: number;
  duration: number;
  is_new: boolean;
  questions: any;
};

const fetchQuizSubjectsFromSheet = async (
  subjects: Array<{
    name: string;
    url: string;
    test_name: string;
    pass_mark: number;
  }>
): Promise<Array<SavedQuizDataType>> => {
  let quizzes = await getQuizzesFromSubjects(
    subjects.map(({ test_name }) => test_name)
  );
  let quizzesData = subjects.map((subject, index) => ({
    skill: subject.name,
    pass_mark: subject.pass_mark,
    url: subject.url,
    questions: quizzes[index],
  }));
  return await bulkCreateQuizOnBackend(quizzesData);
};

const transfromData = (data, showAnswer) =>
  data.map((item) => ({
    id: item.id,
    pretext: item.pretext,
    content: item.content,
    figure: item.image,
    is_latex: item.is_latex || false,
    comprehension: item.comprehension
      ? {
          passage: item.comprehension,
        }
      : null,
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

const generateQuestionSplit = (
  numOfSubjects: number,
  total_questions: number
): number[] => {
  const numOfQuestions = new Array(numOfSubjects);
  numOfQuestions.fill(0);
  for (let i = 0; i < total_questions; i++) {
    let pointer = i % numOfSubjects;
    numOfQuestions[pointer] = numOfQuestions[pointer] + 1;
  }
  return numOfQuestions;
};

const getQuizQuestions = async (subject: string, showAnswer: boolean) => {
  const questions = await getQuizData(subject);
  return transfromData(questions, showAnswer);
};

function verifyAccessToken(access_token, force = true, returnResult = false) {
  let result = null;
  try {
    if (force) {
      result = jwt.verify(access_token, process.env.SECRET_KEY);
    } else {
      result = jwt.decode(access_token);
    }
    return result;
  } catch (error) {
    return null;
  }
}

export function getUserInfo(
  access_token,
  force = false
): { personalInfo: { email: string } } {
  let new_token = access_token
    .replace("Bearer", "")
    .replace("Access", "")
    .trim();
  let data = verifyAccessToken(new_token, force);
  if (data) {
    return data;
  }
  return null;
}

function formatSubjects(subjects) {
  const result = subjects.map((item) => {
    // const { category, subcategory } = subjectsData.find(
    //   (subject) => item.skill.name === subject.tuteria_name
    // ) || { category: null, subcategory: null };
    let mapping = {
      1: "pending",
      2: "active",
      3: "suspended",
      4: "denied",
      5: "in-progress",
    };
    return {
      // ...item,
      id: item.pk,
      name: item.skill.name,
      title: item.heading || "",
      description: item.description,
      certifications: item.certifications,
      tuteriaStatus: item.status,
      status: mapping[item.status],
      // test_detail: test_detail.find(
      //   ({ name, testable }: any) => name === item.skill.name && testable
      // ) || null,
      // category,
      // subcategory,
    };
  });
  return result;
}
function buildQuizInfo(
  subjectInfo: TuteriaSubjectType,
  quizDataFromSheet,
  showAnswer = false
) {
  const DEFAULT_TOTAL_QUESTIONS = 30;
  const QUIZ_DURATION = 30;
  const QUIZ_TYPE = "Multiple choice";
  const quizQuestions = quizDataFromSheet.map(({ questions }) =>
    transfromData(questions, showAnswer)
  );
  let questionSplit: number[];
  let questions: any;
  if (subjectInfo.subjects.length > 1) {
    questionSplit = generateQuestionSplit(
      subjectInfo.subjects.length,
      DEFAULT_TOTAL_QUESTIONS
    );
    questions = quizQuestions
      .map((questions, index) => questions.splice(0, questionSplit[index]))
      .flat();
  } else {
    questions = quizQuestions[0];
  }
  let pass_mark = 70;
  return {
    title: subjectInfo.name,
    slug: subjectInfo.slug,
    pass_mark,
    type: QUIZ_TYPE,
    duration: QUIZ_DURATION,
    questions,
  };
}
export const serverAdapter = {
  apiTest: API_TEST,
  bulkFetchQuizSubjectsFromSheet,
  getUserInfo,
  getQuizzesForTuteriaSubject: fetchQuizSubjectsFromSheet,
  async saveTutorInfo(data: any, encode = false) {
    let result = await saveTutorInfoService(data);
    if (encode) {
      result.accessToken = this.upgradeAccessToken(result);
    }
    return result;
  },
  getTutorInfo: async (email: string) => {
    const data = await authenticateLoginDetails({
      email,
      auto_login: true,
      is_admin: true,
    });
    return data;
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
  generateQuizzes: async ({
    name,
    subjects,
    total_questions,
    showAnswer = false,
  }: {
    name: string;
    subjects: Array<{
      name: string;
      url: string;
      test_name: string;
      pass_mark: number;
    }>;
    total_questions: number;
    showAnswer: boolean;
  }) => {
    const DEFAULT_TOTAL_QUESTIONS = 30;
    const quizDataFromSheet: any = await fetchQuizSubjectsFromSheet(subjects);
    // const quizQuestionPromises = subjects.map(({ url }) =>
    //   getQuizQuestions(url, showAnswer)
    // );
    // const quizQuestions = await Promise.all(quizQuestionPromises);
    const quizQuestions = quizDataFromSheet.map(({ questions }) =>
      transfromData(questions, showAnswer)
    );
    let questionSplit: number[];
    let result: any;
    if (total_questions) {
      questionSplit = generateQuestionSplit(subjects.length, total_questions);
      result = quizQuestions
        .map((questions, index) => questions)
        .flat();
    } else {
      questionSplit = generateQuestionSplit(
        subjects.length,
        DEFAULT_TOTAL_QUESTIONS
      );
      result = subjects.map((subject, index) => ({
        subject: subject.name,
        passmark: quizDataFromSheet[index].passmark,
        questions: showAnswer
          ? quizQuestions[index]
          : quizQuestions[index],
      }));
    }
    return result;
  },
  generateQuizes: async ({
    name,
    slug,
    subjects,
    pass_mark,
    showAnswer = false,
  }: {
    name: string;
    slug: string;
    pass_mark: string;
    subjects: Array<{
      name: string;
      url: string;
      test_name: string;
      pass_mark: number;
    }>;
    showAnswer: boolean;
  }) => {
    const DEFAULT_TOTAL_QUESTIONS = 30;
    const QUIZ_DURATION = 30;
    const QUIZ_TYPE = "Multiple choice";
    const quizDataFromSheet: any = await fetchQuizSubjectsFromSheet(subjects);
    const quizQuestions = quizDataFromSheet.map(({ questions }) =>
      transfromData(questions, showAnswer)
    );
    let questionSplit: number[];
    let questions: any;
    if (subjects.length > 1) {
      questionSplit = generateQuestionSplit(
        subjects.length,
        DEFAULT_TOTAL_QUESTIONS
      );
      questions = quizQuestions
        .map((questions, index) => questions.splice(0, questionSplit[index]))
        .flat();
    } else {
      questions = quizQuestions[0];
    }

    return {
      title: name,
      slug,
      pass_mark,
      type: QUIZ_TYPE,
      duration: QUIZ_DURATION,
      questions,
    };
  },
  startQuiz: async (data: { email: string; subjects: string[] }) => {
    return await beginQuiz(data);
  },
  async completeQuiz(data: {
    email: string;
    name: string;
    avg_passmark: number;
    time_elapsed: boolean;
    subjects: string[];
    answers: Array<{ question_id: number; answer: number }>;
    question_count: number;
  }) {
    let quizzes = await this.generateQuizes({
      name: data,
      subjects: data.subjects,
      showAnswer: true,
    });
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
    grading.result.forEach(({ passed, score, subject }) => {
      if (passed) {
        groupedGrading.passed.push({ score, skill: subject });
      } else {
        groupedGrading.failed.push({ score, skill: subject });
      }
    });
    return await updateTestStatus(groupedGrading);
  },
  gradeQuiz(
    quizzes: Array<{
      subject: string;
      questions: Array<any>;
      passmark: number;
    }>,
    answers: Array<{ question_id: string; answer: number }>,
    question_count: number
  ): {
    passed: boolean;
    avgPassmark: number;
    totalQuizGrade: number;
    result: Array<{
      score: number;
      passed: boolean;
      passmark: number;
      subject: string;
    }>;
  } {
    /**This function is an internal function, you would need to make api calls to get
     * the quiz data.
     */
    let avgPassmark = sum(quizzes.map((o) => o.passmark)) / quizzes.length;
    // group the answers into their corresponding quizes
    let combinedQuestions = quizzes
      .map((quiz) => {
        return quiz.questions.map((o) => ({ ...o, subject: quiz.subject }));
      })
      .flat();
    let transformedAnswers = answers.map((a) => {
      let found = combinedQuestions.find((o) => o.id === a.question_id);
      let isCorrect = false;
      let subject = null;
      if (found) {
        isCorrect = found.answers[a.answer].correct === true;
        subject = found.subject;
      }
      return { ...a, correct: isCorrect, subject };
    });
    let passedQuizAvg =
      (transformedAnswers.filter((o) => o.correct).length * 100) /
      question_count;
    let graded = groupBy(transformedAnswers, "subject");
    let result = {};
    Object.keys(graded).forEach((gr) => {
      let key = gr;
      let quizInstance = quizzes.find((o) => o.subject === gr);
      let value = graded[gr];
      let score = (value.filter((o) => o.correct).length * 100) / value.length;

      result[key] = {
        score,
        passed: score > quizInstance.passmark,
        passmark: quizInstance.passmark,
      };
    });
    return {
      avgPassmark,
      totalQuizGrade: passedQuizAvg,
      result: Object.keys(result).map((o) => ({ ...result[o], subject: o })),
      passed: passedQuizAvg > avgPassmark,
    };
  },

  async sendNotification(data, kind = "email") {
    if (kind == "email") {
      await sendEmailNotification(data);
    }
  },

  upgradeAccessToken(userInfo) {
    return jwt.sign(userInfo, process.env.SECRET_KEY, {
      expiresIn: 60 * 60 * 24,
    });
  },

  async authenticateUserCode(email: string, code: string) {
    const data = await authenticateLoginDetails({ email, code });
    return data;
  },

  async loginUser(email: string) {
    const data = await authenticateLoginDetails({ email });
    if ("code" in data) {
      const payload = sendClientLoginCodes(email, data.code);
      await this.sendNotification(payload);
      return { email: data.email };
    }
    const accessToken = this.upgradeAccessToken(data);
    return { accessToken };
  },

  async saveTutorSubject(payload: any) {
    const data = await saveTutorSubjectService(payload);
    return data;
  },
  // async gradeQuiz(
  //   answers: Array<{ question_id: string; answer: string }>,
  //   subjects: string[]
  // ) {
  //   // using the subjects array passed, get the list of all
  //   return {};
  // },
  selectSubjects: async ({
    email,
    subjects,
  }: {
    email: string;
    subjects: string[];
  }) => {
    const selectedSubjects = await saveUserSelectedSubjects({
      email,
      subjects,
    });
    const [
      allowedQuizzes,
      // subjectsData
    ] = await Promise.all([
      fetchAllowedQuizesForUser(email),
      // getTestableSubjects(),
    ]);
    // const { category, subcategory } = subjectsData.find(
    //   (subject) => item.skill.name === subject.tuteria_name
    // ) || { category: null, subcategory: null };
    const skills = formatSubjects(selectedSubjects);
    return { skills, allowedQuizzes };
    // .filter((item) => item.category);
  },
  retakeQuiz: async ({
    email,
    subjects,
  }: {
    email: string;
    subjects: string[];
  }) => {
    const response = await userRetakeTest({ email, subjects });
    // const [selectedSubjects,
    //   subjectsData
    // ] = await Promise.all([
    //   saveUserSelectedSubjects({
    //     email,
    //     subjects: [],
    //   }),
    //   getTestableSubjects(),
    // ]);
    // const { category, subcategory } = subjectsData.find(
    //   (subject) => item.skill.name === subject.tuteria_name
    // ) || { category: null, subcategory: null };
    const skills = formatSubjects(response);
    return skills;
    // .filter((item) => item.category);
  },
  getTutorSubjects: async (email: string) => {
    const selectedSubjects = await saveUserSelectedSubjects({
      email,
      subjects: [],
    });
    const [
      allowedQuizzes,
      //  subjectsData
    ] = await Promise.all([
      fetchAllowedQuizesForUser(email),
      // getTestableSubjects(),
    ]);
    let skills = formatSubjects(selectedSubjects);
    return { skills, allowedQuizzes };
    // .filter((item) => item.category);
  },
  async getTuteriaSubjects(
    subject?: string
  ): Promise<Array<TuteriaSubjectType> | TuteriaSubjectType> {
    const subjects = await getTuteriaSubjectData();
    const formattedSubjects = subjects.map((subject) => ({
      ...subject,
      subjects: subject.subjects.map(
        ({ shortName, url, test_name, pass_mark }) => ({
          name: shortName,
          url,
          test_name,
          pass_mark,
        })
      ),
    }));
    if (!subject) return formattedSubjects;
    const foundSubject = formattedSubjects.find(
      (item) => item.slug === subject
    );
    if (foundSubject) return foundSubject;
    throw new Error("Subject not found");
  },

  getCountries: fetchAllCountries,
  getRegions: async () => {
    let { regions } = await getLocationInfoFromSheet();
    return regions;
  },
};

function sum(array: number[]) {
  return array.reduce((a, b) => a + b, 0);
}
