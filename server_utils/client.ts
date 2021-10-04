import { ServerAdapterType } from "@tuteria/shared-lib/src/adapter";
import storage from "@tuteria/shared-lib/src/local-storage";
import jwt_decode from "jwt-decode";
import { TuteriaSubjectType } from "./server";

const NEW_TUTOR_TOKEN = "NEW_TUTOR_TOKEN";
const TUTOR_QUIZZES = "TUTOR-QUIZZES";
const TUTERIA_SUBJECT_KEY = "TUTERIA-SUBECTS";

function decodeToken(existingTokenFromUrl = "", key = NEW_TUTOR_TOKEN) {
  let urlAccessToken = existingTokenFromUrl;
  if (!urlAccessToken) {
    //check the local storage for the token.
    urlAccessToken = storage.get(key);
  }
  if (urlAccessToken) {
    //attempt to decode it. if successful, save it to local storage and update the store
    try {
      let result = jwt_decode(urlAccessToken);
      storage.set(key, urlAccessToken);
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

export const clientAdapter: ServerAdapterType = {
  cloudinaryApiHandler: async () => {},
  uploadApiHandler: async () => {},
  deleteSubject: async () => {},
  fetchQuizQuestions: async () => {},
  async getTutorSubjects() {
    try {
      const tuteriaSubjectsInStorage = storage.get(TUTERIA_SUBJECT_KEY);
      let tuteriaSubjects;
      const tutorToken = storage.get(NEW_TUTOR_TOKEN);
      if (Object.keys(tuteriaSubjectsInStorage).length) {
        tuteriaSubjects = tuteriaSubjectsInStorage;
      } else {
        const response: any = await fetch("/api/quiz/get-tuteria-subjects", {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + tutorToken,
          },
          method: "POST",
          body: JSON.stringify({}),
        });
        const { data } = await response.json();
        tuteriaSubjects = data;
        storage.set(TUTERIA_SUBJECT_KEY, data);
      }
      return { tuteriaSubjects, tutorSubjects: [] };
    } catch (error) {
      throw "Failed to fetch tutor subjects";
    }
  },

  loadExistingTutorInfo: () => {
    return decodeToken();
  },
  saveTutorInfo: async (payload) => {
    const response = await fetch(`/api/tutors/save-tutor-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const { data } = await response.json();
      storage.set(NEW_TUTOR_TOKEN, data.accessToken);
      delete data.accessToken;
      return data;
    }
    throw "Failed to save tutor info";
  },
  submitSelectedSubjects: async () => {},
  updateTutorSubjectInfo: async () => {},
  updateUserPassword: async () => {},
  validateCredentials: () => {
    let data = decodeToken();
    if (data) {
      return cleanTutorInfo(data);
    } else {
      throw "Invalid Credential";
    }
  },
  beginTutorApplication: async (data: any) => {
    const token = storage.get(NEW_TUTOR_TOKEN, "");
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
        storage.set(NEW_TUTOR_TOKEN, data.accessToken);
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
        storage.set(NEW_TUTOR_TOKEN, data.access_token);
      }
      return data;
    }
    throw "Error submitting";
  },
  async generateQuiz(payload: TuteriaSubjectType) {
    const tutorToken = storage.get(NEW_TUTOR_TOKEN);
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
};
