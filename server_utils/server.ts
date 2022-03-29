import {
  buildQuizInfo,
  formatSubjects,
  getIpData,
  getPreferences,
  getQuizzesFromSubjects,
  getSheetTestData,
  getStaticInfo,
  getTestableSubjects,
  getTuteriaSubjectData,
  getTuteriaSubjectList,
  getTuteriaSubjects,
  transformData,
} from "@tuteria/tuteria-data/src";
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
  fetchAllowedQuizesForUser,
  getNonTestableSubjects,
  HOST,
  saveTutorInfoService,
  saveTutorSubjectInfo,
  saveTutorSubjectService,
  saveUserSelectedSubjects,
  sendEmailNotification,
  serverValidatePersonalInfo,
  updateNonTestableSubjects,
  updateTestStatus,
  userRetakeTest,
} from "./hostService";
async function updateAllNonTestables(run = false) {
  let [tuteriaSubjects, nonTestableSubject] = await Promise.all([
    getTuteriaSubjectData(),
    getNonTestableSubjects(),
  ]);
  const validTuteriaSubjects = tuteriaSubjects.filter((subject) => {
    return (
      nonTestableSubject.includes(subject.name) &&
      (subject.testSheetID as any) !== ""
    );
  });
  if (run) {
    let payload = [];
    for (let i = 0; i < validTuteriaSubjects.length; i++) {
      let r: any = validTuteriaSubjects[i];
      console.log("bulkUpdate for " + r.name);
      try {
        await fetchQuizSubjectsFromSheet(
          r.subjects.map((v) => ({
            name: v.skill,
            test_sheet_id: v.testSheetID,
            ...v,
          }))
        );
      } catch (error) {
        console.log(error);
      } finally {
        payload.push({ name: r.name, quiz: r.subjects[0].skill });
      }
    }
    console.log("Updating record of non-testables to django");
    await updateNonTestableSubjects(payload);
  }
  // validTuteriaSubjects.forEach((subject) => {});
  return validTuteriaSubjects;
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
    questions: transformData(item.questions, true, item.name),
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

// const getQuizQuestions = async (subject: string, showAnswer: boolean) => {
//   const questions = await getQuizData(subject);
//   return transformData(questions, showAnswer,subject);
// };

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
    return await getStaticInfo();
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
    duration,
    total_questions = 15,
  }: {
    slug: string;
    name: string;
    pass_mark: number;
    duration: number;
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
      { slug, name, pass_mark, subjects, duration },
      fetchedQuizzes,
      total_questions
    );
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
  async authenticateUserTelegram(telegram_id: string) {
    const data = await authenticateLoginDetails({ telegram_id });
    let {
      personalInfo: { email },
    } = data;
    return await this.getTutorDetails(email, true, true, data);
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
  uploadMedia: async (
    files: File[],
    options: any,
    transform: boolean,
    quality_check = false,
    face_check = false
  ) => {
    const data = await Promise.all(
      files.map((file) => {
        return upload(file, options, transform, quality_check, face_check);
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
    let result: {
      tutorData: any;
      tutorSubjects: any[];
      accessToken?: string;
      redirectUrl?: string;
      actualUrl?:string
    } = { tutorData: response[0], tutorSubjects: [] };
    if (response.length > 1) {
      result.tutorSubjects = response[1].skills;
    }
    if (decodeToken) {
      result.accessToken = this.upgradeAccessToken(result.tutorData);
    }
    if (result?.tutorData?.application_status === "VERIFIED") {
      let { pk, slug } = result.tutorData;
      result.redirectUrl = `${HOST}/users/authenticate/${pk}/${slug}?redirect_url=/dashboard/`;
    }
    let { pk, slug } = result.tutorData;
    result.actualUrl = `${HOST}/users/authenticate/${pk}/${slug}`;
    return result;
  },
  async beginTutorApplication({ email, firstName, password, countryCode }) {
    const data = await authenticateLoginDetails({
      email,
      other_details: {
        first_name: firstName,
        password,
        // date_joined: new Date()
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
    other_texts: Array<{ key: string; value: string }>,
    key?: string,
    parse = false,
    config = { similarity: 0.7 }
  ) {
    let multiple_texts = other_texts.map((o) => o.value);
    let { spelling, grammar, similarity } = await checkSpellingAndGrammar(
      text,
      multiple_texts,
      parse
    );
    console.log(similarity);
    let newSimilarity = similarity
      .map((j, i) => ({
        key: other_texts[i].key,
        value: j,
      }))
      .filter((u) => u.value.similarity >= config.similarity)
      .map((o) => o.key);
    if (key) {
      return { key, data: { grammar, similarSubjects: newSimilarity } };
    }
    return { grammar, similarSubjects: newSimilarity };
  },
  async bulkSpellChecker(
    checks: Array<{ key?: string; text?: string; other_texts: string[] }>,
    config: any
  ) {
    let instance = this;
    let response = await Promise.all(
      checks.map((o) =>
        instance.spellCheck(o.text, o.other_texts, o.key, true, config)
      )
    );
    let result = {};
    response.forEach((r) => {
      result[r.key] = r.data;
    });
    let hasError = response.some(
      (u) =>
        Object.values(u.data.grammar).length > 0 ||
        u.data.similarSubjects.length > 0
    );
    return { data: result, hasError };
  },
  async validatePersonalInfo(payload: any, personalInfo: any) {
    let result = await serverValidatePersonalInfo(payload, personalInfo.email);
    if (Object.keys(result).length > 0) {
      return {
        hasError: true,
        data: result,
      };
    }
    return {};
  },
  async getIpFromRequest(req: any) {
    let client_ip = undefined;
    if (req) {
      client_ip = req.headers["x-forwarded-for"] || "";
      // if client ip is more than 1
      client_ip = client_ip.split(",")[0];
    }
    let ipLocations = await getIpData(client_ip);
    return ipLocations;
  },
  updateAllNonTestables,
  async hijackTutor(email) {
    const tutorInfo = await this.getTutorInfo(email, true, true);
    const accessToken = this.upgradeAccessToken(tutorInfo);
    return accessToken;
  },
};
