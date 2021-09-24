import DATA from "@tuteria/shared-lib/src/tutor-revamp/quizzes/sample-quiz-data";
import storage from "@tuteria/shared-lib/src/local-storage";
import jwt_decode from 'jwt-decode';

const CLIENT_TOKEN = "CLIENT_TOKEN";
const REGION_KEY = "TEST-REGIONS-VICINITIES";
const COUNTRY_KEY = "TEST-COUNTRIES";

export const adapter = {
  regionKey: REGION_KEY,
  countryKey: COUNTRY_KEY,
  async fetchTutorInfo(id: string) {
    const response = await fetch(`/api/get-tutor-info?tutor=${id}`);

    if (response.ok) {
      const { data } = await response.json();
      return data;
    }

    throw "Failed to tutor info";
  },

  deleteSubject: (id: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(id);
      }, 3000);
    });
  },
  saveTutorInfo: (key: string, value: any, slug: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({});
      }, 3000);
    });
  },
  submitSelectedSubjects: (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, 1000);
    });
  },
  fetchQuizQuestions: async (quizSubjects: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ quiz: DATA.quiz, quizSubjects });
      }, 2000);
    });
  },
  toNextPath: async () => { },
  postResults: async (answers: Array<any>, subject) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ subject, answers });
      }, 3000);
    });
  },

  async onEmailSubmit({ email }) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw "Error submitting";
  },

  async onVerifyOTP({ email, otp }) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp })
    });
    if (response.ok) {
      const { data } = await response.json();
      storage.set(CLIENT_TOKEN, data.access_token);
      return data;
    }
    throw "Error submitting";
  },

  decodeToken(existingTokenFromUrl, key = CLIENT_TOKEN) {
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
      }
    }
  },
};