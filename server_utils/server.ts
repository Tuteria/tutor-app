import { File } from "formidable";
import jwt from "jsonwebtoken";
import { destroy, upload } from "./cloudinary";
import { sendClientLoginCodes } from "./email";
import {
  API_TEST,
  authenticateLoginDetails,
  beginQuiz,
  bulkCreateQuizOnBackend,
  checkSpellingAndGrammar,
  deleteTutorSubject,
  fetchAllCountries,
  fetchAllowedQuizesForUser,
  getQuizData,
  saveTutorInfoService,
  saveTutorSubjectInfo,
  saveTutorSubjectService,
  saveUserSelectedSubjects,
  sendEmailNotification,
  TuteriaSubjectServerResponse,
  updateTestStatus,
  userRetakeTest,
} from "./hostService";
import {
  getEducationData,
  getLocationInfoFromSheet,
  getQuizzesFromSubjects,
  getSheetTestData,
  getSupportedCountries,
  getTestableSubjects,
  getTuteriaSubjectData,
  getTuteriaSubjectList,
  getPreferences,
  getSpellCheckDetails,
} from "@tuteria/tuteria-data/src";
import { TuteriaSubjectType } from "./types";

const DEFAULT_TOTAL_QUESTIONS = 30;
function buildQuizInfo(
  subjectInfo: TuteriaSubjectType,
  quizDataFromSheet: Array<{
    name: string;
    passmark: number;
    questions: any[];
  }>,
  total_questions = DEFAULT_TOTAL_QUESTIONS
) {
  const QUIZ_DURATION = 30;
  const QUIZ_TYPE = "Multiple choice";
  const subjects = subjectInfo.subjects.map((o) => o.name);
  let fetchedQuizzes = quizDataFromSheet;
  const filteredQuizzes = fetchedQuizzes.filter((x) =>
    subjects.includes(x.name)
  );
  const questionsFromFilteredQuizzes = filteredQuizzes.map((o) => o.questions);
  let questionSplit: number[] = generateQuestionSplit(
    filteredQuizzes.length,
    total_questions
  );
  let questions: any;
  if (filteredQuizzes.length > 1) {
    questionSplit = generateQuestionSplit(
      filteredQuizzes.length,
      total_questions
    );
    questions = questionsFromFilteredQuizzes
      .map((questions, index) => questions.slice(0, questionSplit[index]))
      .flat();
  } else {
    questions = questionsFromFilteredQuizzes[0].slice(0, questionSplit[0]);
  }
  return [
    {
      title: subjectInfo.name,
      slug: subjectInfo.slug,
      pass_mark: subjectInfo.pass_mark,
      type: QUIZ_TYPE,
      duration: QUIZ_DURATION,
      questions,
    },
    fetchedQuizzes,
  ];
}

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
function is_figure(content: string) {
  let regex =
    /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/gm;
  let matched = content.match(regex);
  if (Array.isArray(matched)) {
    return matched[0];
  }
  return null;
}
const transformData = (data: any, showAnswer = false) =>
  data.map((item) => {
    const question = {
      id: item.id,
      pretext: item.pretext || null,
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
          figure: is_figure(option.content),
          answer_type: "TEXT",
        };
        return showAnswer
          ? { ...optionData, correct: showAnswer ? option.correct : null }
          : optionData;
      }),
    };

    if (question.answers[0].figure) question.options_display = "horizontal";

    return question;
  });

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
    test_sheet_id?: number;
  }>,
  refresh = false
): Promise<Array<any>> => {
  let quizzes = await getQuizzesFromSubjects(
    subjects.map(({ test_name, test_sheet_id }) => ({
      test_name,
      test_sheet_id,
    })),
    refresh
  );
  let quizzesData = subjects.map((subject, index) => ({
    skill: subject.name,
    pass_mark: subject.pass_mark,
    url: subject.url,
    questions: quizzes[index],
  }));
  const result: Array<SavedQuizDataType> = await bulkCreateQuizOnBackend(
    quizzesData,
    refresh
  );
  if (refresh) {
    return result;
  }
  return result.map((item) => ({
    ...item,
    questions: transformData(item.questions, true),
  }));
};

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
  return transformData(questions, showAnswer);
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

function formatSubjects(
  subjects: TuteriaSubjectServerResponse,
  allowedQuizzes: Array<{ name: string }> = []
) {
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
    let status = mapping[item.status];
    let exists = allowedQuizzes.find((o) => o.name === item.skill.name);
    if (exists) {
      status = "not-started";
    }
    return {
      // ...item,
      id: item.pk,
      name: item.skill.name,
      title: item.heading || "",
      description: item.description,
      certifications: item.certifications.map(
        ({ award_name, award_institution }) => ({
          name: award_name,
          institution: award_institution,
        })
      ),
      tuteriaStatus: item.status,
      status,
      hourlyRate: item.price,
      // preferences: item.other_info.preferences || [],
      preferences: item.other_info?.preliminaryQuestions || [],
      agree: item.other_info?.agree || false,
      teachingStyle: item.other_info?.teachingStyle || "",
      trackRecords: item.other_info?.trackRecords || "",
      teachingRequirements: item.other_info?.teachingRequirements || [],
      // preliminaryQuestions: item.other_info?.preliminaryQuestions || [],
      preliminaryQuestions: [],
      canTakeTest:
        item.sittings.length === 0 && (item.status === 3 || item.status === 5),
      exhibitions: (item.exhibitions || []).map((o) => {
        return {
          url: o.url || "",
          id: o.image,
          caption: o.caption,
        };
      }),
      // test_detail: test_detail.find(
      //   ({ name, testable }: any) => name === item.skill.name && testable
      // ) || null,
      // category,
      // subcategory,
    };
  });
  return result;
}

async function getTuteriaSubjectsWithPreferences() {
  const [tuteriaSubjects, preferences] = await Promise.all([
    getTuteriaSubjects(),
    getPreferences(),
  ]);
  return { tuteriaSubjects, preferences };
}

async function getTuteriaSubjects(
  subject?: string
): Promise<Array<TuteriaSubjectType> | TuteriaSubjectType | any> {
  const subjects = await getTuteriaSubjectData();
  const formattedSubjects = subjects.map((subject) => ({
    ...subject,
    subjects: subject.subjects.map(
      ({ shortName, url, test_name, pass_mark, testSheetID }) => ({
        name: shortName,
        url,
        test_name,
        pass_mark,
        test_sheet_id: testSheetID || null,
      })
    ),
  }));
  if (!subject) return formattedSubjects;
  const foundSubject = formattedSubjects.find((item) => item.slug === subject);
  if (foundSubject) return foundSubject;
  throw new Error("Subject not found");
}
async function getTutorSubjects(email: string) {
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
  let skills = formatSubjects(selectedSubjects, allowedQuizzes);
  return { skills, allowedQuizzes };
  // .filter((item) => item.category);
}

async function createQuizFromSheet({ subjects }) {
  const result = await fetchQuizSubjectsFromSheet(subjects, true);
  return result;
}

export const serverAdapter = {
  apiTest: API_TEST,
  bulkFetchQuizSubjectsFromSheet,
  getUserInfo,
  getQuizzesForTuteriaSubject: fetchQuizSubjectsFromSheet,
  createQuizFromSheet,
  async initializeApplication(includePrefs?: boolean) {
    const [
      result,
      allCountries,
      supportedCountries,
      educationData,
      subjectData,
    ] = await Promise.all([
      getLocationInfoFromSheet(),
      fetchAllCountries(),
      getSupportedCountries(),
      getEducationData(),
      includePrefs ? getTuteriaSubjectsWithPreferences() : getTuteriaSubjects(),
    ]);

    const data: any = {
      allRegions: result.regions,
      allCountries,
      supportedCountries,
      educationData,
    };

    if (Array.isArray(subjectData)) {
      data.tuteriaSubjects = subjectData;
    } else {
      data.tuteriaSubjects = subjectData.tuteriaSubjects;
      data.preferences = subjectData.preferences;
    }
    return data;
  },

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
    slug,
    name,
    pass_mark,
    subjects,
    total_questions,
  }: {
    slug: string;
    name: string;
    pass_mark: number;
    subjects: Array<{
      name: string;
      url: string;
      test_name: string;
      pass_mark: number;
      test_sheet_id: number;
    }>;
    total_questions: number;
  }) => {
    const fetchedQuizzes: any = await fetchQuizSubjectsFromSheet(subjects);
    return buildQuizInfo(
      { slug, name, pass_mark, subjects },
      fetchedQuizzes,
      total_questions
    );
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
      test_sheet_id?: number;
    }>;
    showAnswer: boolean;
  }) => {
    const DEFAULT_TOTAL_QUESTIONS = 30;
    const QUIZ_DURATION = 30;
    const QUIZ_TYPE = "Multiple choice";
    const quizDataFromSheet: any = await fetchQuizSubjectsFromSheet(subjects);
    const quizQuestions = quizDataFromSheet.map(({ questions }) =>
      transformData(questions, showAnswer)
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
    grading: {
      passed: boolean;
      avgPassmark: number;
      totalQuizGrade: number;
      result: Array<{
        score: number;
        passed: boolean;
        passmark: number;
        subject: string;
      }>;
    };
  }) {
    let grading = data.grading;
    const groupedGrading: {
      email: string;
      name?: string;
      passed: any[];
      failed: any[];
    } = {
      name: data.name,
      email: data.email,
      passed: [],
      failed: [],
    };

    grading.result.forEach(({ passed, score, subject }) => {
      if (passed) {
        groupedGrading.passed.push({ score, skill: subject });
      } else {
        groupedGrading.failed.push({ score, skill: subject });
      }
    });
    return await updateTestStatus(groupedGrading);
  },

  async sendNotification(data, kind = "email") {
    if (kind == "email") {
      await sendEmailNotification(data);
    }
  },

  upgradeAccessToken(userInfo) {
    let { email, firstName, lastName, nationality } = userInfo.personalInfo;
    return jwt.sign(
      // userInfo,
      {
        slug: userInfo.slug,
        personalInfo: { email, firstName, lastName, nationality },
      },
      process.env.SECRET_KEY,
      {
        expiresIn: 60 * 60 * 24,
      }
    );
  },

  async authenticateUserCode(email: string, code: string) {
    const data = await authenticateLoginDetails({
      email,
      code,
      verify_email: true,
    });
    if ("code" in data) {
      return data;
    }
    let response = await this.getTutorDetails(email, true, true, data);
    return response;
  },

  async loginUser(email: string) {
    const data = await authenticateLoginDetails({ email });
    if ("code" in data) {
      const payload = sendClientLoginCodes(email, data.code);
      await this.sendNotification(payload);
      return { email: data.email, loginType: "code" };
    }
    return await this.getTutorDetails(email, true, true, data);
  },

  async saveTutorSubject(payload: any) {
    const data = await saveTutorSubjectService(payload);
    return data;
  },

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
    const skills = formatSubjects(selectedSubjects, allowedQuizzes);
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
    // const skills = formatSubjects(response);
    // return skills;
    return response;
    // .filter((item) => item.category);
  },
  getTutorSubjects,

  deleteSubject: async (data: { email: string; ids: number[] }) => {
    const response = await deleteTutorSubject(data);
    return response;
  },
  uploadMedia: async (files: File[], options: any, transform: boolean) => {
    const data = await Promise.all(
      files.map((file) => {
        return upload(file, options, transform);
      })
    );
    return data;
  },
  saveTutorSubjectDetails: async (subject: any) => {
    const result = await saveTutorSubjectInfo(subject);
    return result;
  },
  getTuteriaSubjects,
  deleteMedia: async (data) => {
    const result = await destroy(data);
    return result;
  },
  async getTutorDetails(
    email: string,
    withSubject = false,
    decodeToken = false,
    tutorData?: any
  ) {
    let promise = [Promise.resolve(tutorData)];
    if (!tutorData) {
      promise = [
        authenticateLoginDetails({
          email,
          auto_login: true,
          is_admin: true,
        }),
      ];
    }
    if (withSubject) {
      promise.push(getTutorSubjects(email));
    }
    let response = await Promise.all(promise);
    let result: { tutorData: any; tutorSubjects: any[]; accessToken?: string } =
      { tutorData: response[0], tutorSubjects: [] };
    if (response.length > 1) {
      result.tutorSubjects = response[1].skills;
    }
    if (decodeToken) {
      result.accessToken = this.upgradeAccessToken(result.tutorData);
    }
    return result;
  },
  async beginTutorApplication({ email, firstName, password, countryCode }) {
    const data = await authenticateLoginDetails({
      email,
      other_details: {
        first_name: firstName,
        password,
      },
    });
    if ("code" in data) {
      const payload = sendClientLoginCodes(email, data.code);
      await this.sendNotification(payload);
      return { email: data.email, loginType: "code" };
    }
    return await this.getTutorDetails(email, true, true, data);
  },

  async getPreferences() {
    const preferences = await getPreferences();
    return preferences;
  },
  async spellCheck(
    text: string,
    other_texts: string[],
    key?: string,
    parse = false
  ) {
    let result = await checkSpellingAndGrammar(text, other_texts, parse);
    if (key) {
      return { key, data: result };
    }
    return result;
  },
  async bulkSpellChecker(
    checks: Array<{ key?: string; text?: string; other_texts: string[] }>
  ) {
    let instance = this;
    let response = await Promise.all(
      checks.map((o) => instance.spellCheck(o.text, o.other_texts, o.key, true))
    );
    let result = {};
    response.forEach((r) => {
      result[r.key] = r.data;
    });
    return result;
  },
};
