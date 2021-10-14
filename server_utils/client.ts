import axios from 'axios';
import { ServerAdapterType } from "@tuteria/shared-lib/src/adapter";
import storage from "@tuteria/shared-lib/src/local-storage";
import session from "@tuteria/shared-lib/src/storage"
import jwt_decode from "jwt-decode";
import { TuteriaSubjectType } from "./types";

import BANK_DATA from "@tuteria/shared-lib/src/data/banks.json";

const NEW_TUTOR_TOKEN = "NEW_TUTOR_TOKEN";
const TUTOR_QUIZZES = "TUTOR-QUIZZES";
const TUTERIA_SUBJECTS_KEY = "TUTERIA_SUBJECTS";

function decodeToken(existingTokenFromUrl = "", key = NEW_TUTOR_TOKEN) {
  let urlAccessToken = existingTokenFromUrl;
  if (!urlAccessToken) {
    //check the session storage for the token.
    urlAccessToken = session.get(key, "");
  }
  if (urlAccessToken) {
    //attempt to decode it. if successful, save it to local storage and update the store
    try {
      let result = jwt_decode(urlAccessToken);
      session.set(key, urlAccessToken);
      return result;
    } catch (error) {
      console.log("failed");
      throw error;
    }
  }
}
function cleanTutorInfo(tutor_data: any) {
  return {
    supportedCountries: ["Nigeria"],
    tutor_data,
  };
}

async function postFetcher(url, data = {}, auth = false) {
  let headers: any = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const tutorToken = session.get(NEW_TUTOR_TOKEN);

    headers.Authorization = `Bearer ${tutorToken}`;
  }
  const response = await fetch(url, {
    headers,
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
}

async function multipartFetch(url: string, body: FormData) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.get(NEW_TUTOR_TOKEN, "")}` },
    body,
  });
  return response;
}

async function getFetcher(url, auth = false) {
  let headers: any = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const tutorToken = session.get(NEW_TUTOR_TOKEN);

    headers.Authorization = `Bearer ${tutorToken}`;
  }
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return response;
}
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

const DEFAULT_TOTAL_QUESTIONS = 30;
async function buildQuizInfo(
  subjectInfo: TuteriaSubjectType,
  quizDataFromSheet: Array<{
    name: string;
    passmark: number;
    questions: any[];
  }>
) {
  const QUIZ_DURATION = 30;
  const QUIZ_TYPE = "Multiple choice";
  const subjects = subjectInfo.subjects.map((o) => o.name);
  let fetchedQuizzes;
  if (quizDataFromSheet.length > 0) {
    fetchedQuizzes = quizDataFromSheet;
  } else {
    const response = await postFetcher(
      "/api/quiz/tuteria-subjects-quizzes",
      {
        subjects: subjectInfo.subjects,
      },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      fetchedQuizzes = data;
    }
  }
  const filteredQuizzes = fetchedQuizzes.filter((x) =>
    subjects.includes(x.name)
  );
  const questionsFromFilteredQuizzes = filteredQuizzes.map((o) => o.questions);
  let questionSplit: number[] = generateQuestionSplit(
    filteredQuizzes.length,
    DEFAULT_TOTAL_QUESTIONS
  );
  let questions: any;
  if (filteredQuizzes.length > 1) {
    questionSplit = generateQuestionSplit(
      filteredQuizzes.length,
      DEFAULT_TOTAL_QUESTIONS
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
export const clientAdapter: ServerAdapterType = {
  fetchBanksInfo: async (countryCode) => {
    return BANK_DATA.NG.map((o) => o.name);
  },
  cloudinaryApiHandler: async (files, progressCallback) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('media', file));
    formData.append('folder', 'identity');
    const { data: response } = await axios.post('/api/tutors/upload-media', formData, {
      headers: {
        Authorization: `Bearer ${session.get(NEW_TUTOR_TOKEN, "")}`,
        "X-Requested-With": "XMLHttpRequest"
      },
      onDownloadProgress(progressEvent) {
        const percentCompleted = Math.floor(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        progressCallback(percentCompleted);
      }
    });
    response.data.forEach((item) => {
      item.name = item.public_id;
      item.secure_url = item.url;
    });
    return response.data;
  },
  uploadApiHandler: async (files, { folder, unique = false }) => {
    const body = new FormData();
    files.forEach((file) => body.append('media', file));
    body.append('folder', folder);
    const response = await multipartFetch('/api/tutors/upload-media', body);
    if (response.ok) {
      const { data } = await response.json();
      return data;
    }
    throw "Failed to upload media";
  },
  async uploadAndVerifyProfile(file) {
    const { slug }: any = decodeToken();
    const formData = new FormData();
    formData.append('media', file);
    formData.append('folder', 'profile_pics');
    formData.append('publicId', `${slug}-profile`);
    formData.append('transform', 'true');
    const response = await multipartFetch('/api/tutors/upload-media', formData);
    if (response.ok) {
      const { data } = await response.json();
      const [image] = data;
      return {
        profile_id: image.public_id,
        url: image.url,
        quality: image.quality,
      }
    }
    throw "Failed to upload profile pic";
  },
  deleteSubject: async (id) => {
    const response = await postFetcher(
      "/api/tutors/delete-tutor-subject",
      { id },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      return data;
    }
    throw "Failed to delete tutor subjects";
  },
  async buildQuizData(subjectInfo, quizzes) {
    let allowedToTakeInfo = buildQuizInfo(subjectInfo, quizzes);
    return allowedToTakeInfo;
  },
  async submitQuizResults(payload) {
    let response = await postFetcher(
      "/api/exam/complete",
      {
        name: payload.name,
        grading: payload.grading,
      },
      true
    );
    if (response.ok) {
      let result = await response.json();
      return result.data;
    }
    throw "Error grading quiz";
  },
  async getTutorSubjects(subjectInfo?: TuteriaSubjectType) {
    let tutorSubjects = [];
    let tuteriaSubjects = [];
    let quizzesAllowed = [];
    try {
      let response = await getFetcher("/api/tutors/get-tutor-subjects", true);
      if (response.ok) {
        let {
          data: { skills, allowedQuizzes },
        } = await response.json();
        tutorSubjects = skills;
        quizzesAllowed = allowedQuizzes;
      }
    } catch (error) {
      console.log(error);
      throw "Error fetching tutor subjects";
    }
    if (subjectInfo) {
      const rr = {
        tutorSubjects: tutorSubjects
          .filter(
            (o) => o.name.toLowerCase() === subjectInfo.name.toLowerCase()
          )
          .map((_tSubject) => {
            // let quizzes = subjectInfo.subjects.filter((x) =>
            //   quizzesAllowed
            //     .map((o) => o.name.toLowerCase())
            //     .includes(x.name.toLowerCase())
            // );
            const quizzes = subjectInfo.subjects;
            return { ..._tSubject, quizzes };
          }),
        tuteriaSubjects,
      };
      return rr;
    }
    return { tutorSubjects, tuteriaSubjects };
  },

  loadExistingTutorInfo: () => {
    return decodeToken();
  },
  saveTutorInfo: async (payload) => {
    const token = session.get(NEW_TUTOR_TOKEN, "");
    const response = await fetch(`/api/tutors/save-tutor-info`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const { data } = await response.json();
      session.set(NEW_TUTOR_TOKEN, data.accessToken);
      delete data.accessToken;
      return data;
    }
    throw "Failed to save tutor info";
  },
  submitSelectedSubjects: async () => { },
  updateTutorSubjectInfo: async () => { },
  updateUserPassword: async () => { },
  validateCredentials: () => {
    let data = decodeToken();
    if (data) {
      return cleanTutorInfo(data);
    } else {
      throw "Invalid Credentials";
    }
  },
  beginTutorApplication: async (data: any) => {
    const token = session.get(NEW_TUTOR_TOKEN, "");
    const response = await fetch("/api/begin-application", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...data,
        token,
      }),
    });

    if (response.ok) {
      const { data } = await response.json();
      if ("accessToken" in data) {
        session.set(NEW_TUTOR_TOKEN, data.accessToken);
        delete data.accessToken;
      }
      return data;
    }
    throw "Failed to register user";
  },
  authenticateUser: async ({ email, otp }: { email: string; otp?: string }) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp }),
    });
    if (response.ok) {
      const { data } = await response.json();
      if (otp) {
        session.set(NEW_TUTOR_TOKEN, data.access_token);
      }
      return data;
    }
    throw "Error submitting";
  },
  async generateQuiz(payload: TuteriaSubjectType) {
    const tutorToken = session.get(NEW_TUTOR_TOKEN);
    const response = await fetch("/api/quiz/generate", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tutorToken,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = await response.json();
    storage.set(TUTOR_QUIZZES, data);
    return data;
  },
  async beginQuiz(payload: { subjects: string[] }) {
    const tutorToken = session.get(NEW_TUTOR_TOKEN);
    const response: any = await fetch("/api/quiz/begin", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tutorToken,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const { data } = response.json();
      return data;
    }
    throw "Failed to start test";
  },

  getTuteriaSubjects() {
    return storage.get(TUTERIA_SUBJECTS_KEY, []);
  },

  saveTutorSubjects: async (subjects) => {
    const response = await postFetcher(
      "/api/tutors/select-subjects",
      { subjects },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      return data.skills;
    }
    throw "Failed to save tutor subjects";
  },

  async saveSubjectImages(files) {
    const body = new FormData();
    body.append('folder', 'exhibitions');
    files.forEach(({ file }) => body.append('media', file));
    const response = await multipartFetch('/api/tutors/upload-media', body);
    if (response.ok) {
      const { data } = await response.json();
      data.forEach((item, index) => {
        item.caption = files[index].caption;
      });
      return data;
    }
  }
};
