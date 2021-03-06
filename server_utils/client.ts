import { AdapterType } from "@tuteria/shared-lib/src/adapter";
import storage from "@tuteria/shared-lib/src/local-storage";
import seshStorage from "@tuteria/shared-lib/src/storage";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { TuteriaSubjectType } from "./types";

export const NEW_TUTOR_TOKEN = "NEW_TUTOR_TOKEN";
const NEW_TUTOR_INFO = "NEW_TUTOR_INFO";
const TUTOR_QUIZZES = "TUTOR-QUIZZES";
const TUTERIA_SUBJECTS_KEY = "TUTERIA_SUBJECTS";
const TUTERIA_PREFERENCE_KEY = "TUTERIA_PREFERENCES";
const CURRENT_SKILL = "TUTERIA_SKILL";
const SUBJECT_DESCRIPTION = "SUBJECT_DESCRIPTION";
const TEACHING_STYLE = "TEACHING_STYLE";
const TRACK_RECORD = "TRACK_RECORD";
export const FETCHED_TUTOR_KEY = "fetchedTutorData";

function decodeToken(existingTokenFromUrl = "", key = NEW_TUTOR_TOKEN) {
  let urlAccessToken = existingTokenFromUrl;
  if (!urlAccessToken) {
    //check the local storage for the token.
    urlAccessToken = storage.get(key, "");
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

async function postFetcher(url, data = {}, auth = false) {
  let headers: any = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const tutorToken = storage.get(NEW_TUTOR_TOKEN);

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
    method: "POST",
    headers: { Authorization: `Bearer ${storage.get(NEW_TUTOR_TOKEN, "")}` },
    body,
  });
  return response;
}

async function getFetcher(url, auth = false) {
  let headers: any = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const tutorToken = storage.get(NEW_TUTOR_TOKEN);

    headers.Authorization = `Bearer ${tutorToken}`;
  }
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return response;
}

async function getTutorInfo(includeSubjects: boolean) {
  const response = await getFetcher(
    `/api/tutors/get-tutor-info?subjects=${includeSubjects}`,
    true
  );
  if (response.ok) {
    const { data } = await response.json();
    const { tutorData, tutorSubjects, accessToken, redirectUrl } = data;
    storage.set(NEW_TUTOR_TOKEN, accessToken);
    storage.set(NEW_TUTOR_INFO, tutorData);
    return { tutorData, tutorSubjects, accessToken, redirectUrl };
  }
  if (response.status === 403) {
    throw "Invalid Credentials";
  }
  throw "Error getting tutor info";
}
async function initializeApplication(
  adapter: AdapterType,
  {
    regions,
    countries,
    supportedCountries,
    educationData,
    tuteriaSubjects,
    preferences = [],
    pricing,
    groups = [],
  }
) {
  let tutorData = storage.get(FETCHED_TUTOR_KEY);
  if (preferences.length > 0) {
    seshStorage.set(TUTERIA_PREFERENCE_KEY, preferences);
  }
  if ("tutorData" in tutorData) {
    storage.clear(FETCHED_TUTOR_KEY);
  } else {
    const {
      accessToken,
      tutorData: x,
      tutorSubjects,
    } = await getTutorInfo(tuteriaSubjects.length > 0);
    tutorData = { accessToken, tutorData: x, tutorSubjects };
  }
  return buildTutorData(tutorData, adapter, {
    regions,
    countries,
    supportedCountries,
    educationData,
    tuteriaSubjects,
    pricing,
    groups,
  });
}
function buildTutorData(
  fetchedData: { tutorData: any; accessToken: any; tutorSubjects: any[] },
  adapter: AdapterType,
  {
    regions,
    countries,
    supportedCountries,
    educationData,
    tuteriaSubjects,
    pricing,
    groups,
  }
) {
  let { tutorData, accessToken, tutorSubjects } = fetchedData;
  tutorSubjects = tutorSubjects.map((subject) => {
    const foundSubject = tuteriaSubjects.find(
      (item) => item.name === subject.name
    );
    if (foundSubject) {
      if (subject.status === "in-progress") {
        let testable = foundSubject.subjects.some((x) => x.test_name);
        if (testable && subject.canTakeTest) {
          subject.status = "not-started";
        } else {
          if (subject.sittingsCount === 0 && testable) {
            subject.status = "not-started";
          }
        }
      }
    }
    return { ...subject, category: foundSubject ? foundSubject.category : "" };
  });
  storage.set(adapter.regionKey, regions);
  storage.set(adapter.countryKey, countries);
  storage.set(adapter.tuteriaSubjectsKey, tuteriaSubjects);
  storage.set(adapter.supportedCountriesKey, supportedCountries);

  return {
    tutorInfo: tutorData,
    accessToken,
    subjectData: { tutorSubjects, tuteriaSubjects, groups },
    staticData: {
      regions,
      countries,
      supportedCountries,
      pricing,
      educationData: {
        degree_data: educationData.degree_data,
        grade_data: educationData.grade_data,
        specialities: educationData.specialities,
        sources: educationData.sources || [],
        languages: educationData.languages || [],
      },
    },
  };
}
function getTutorSubject(
  tutorSubjects: any[],
  subjectInfo: TuteriaSubjectType,
  key = "name",
  action: "edit" | "take_test" = "take_test"
) {
  let instance = tutorSubjects.find((o) => o[key] === subjectInfo[key]);
  if (instance) {
    if (action === "take_test") {
      if (instance.canTakeTest) {
        return { ...instance, quizzes: subjectInfo.subjects };
      }
    }
    if (action === "edit") {
      if (instance.status !== "denied") {
        return { ...instance };
      }
    }
  }
}

const saveSubject = (subject_id, subject) => {
  storage.set(`${CURRENT_SKILL}_${subject_id}`, subject);
};

const clearSubjectDescription = () => {
  storage.clear(SUBJECT_DESCRIPTION);
  storage.clear(TEACHING_STYLE);
  storage.clear(TRACK_RECORD);
};

function getQueryValues() {
  if (typeof window !== "undefined") {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    let result = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      let p = decodeURIComponent(pair[0]);
      let q = decodeURIComponent(pair[1]);
      result[p] = q;
    }
    return result;
  }
  return {};
}

async function buildReviewQuizData(subjectInfo: TuteriaSubjectType) {
  const response = await postFetcher(
    "/api/quiz/generate-review-quiz",
    subjectInfo,
    false
  );
  if (response.ok) {
    const { data } = await response.json();
    let [quizToTake, quizzesList] = data;
    return [quizToTake, quizzesList];
  }
  throw "Error building quiz";
}

async function createQuizFromSheet(subject) {
  const response = await postFetcher(
    "/api/quiz/create-quiz-from-sheet",
    {
      subjects: subject,
    },
    false
  );
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw "Error building quiz";
}

export const clientAdapter: any = {
  storage,
  getQueryValues,
  saveSubject,
  buildReviewQuizData,
  createQuizFromSheet,
  canUseSpinner() {
    if (typeof window !== "undefined") {
      return storage.get(FETCHED_TUTOR_KEY) === "";
    }
    return false;
  },
  fetchBanksInfo: async (countrySupported) => {
    let response = await postFetcher(
      "/api/get-bank-details",
      {
        country: countrySupported,
      },
      true
    );
    if (response.ok) {
      let result = await response.json();
      return result.data;
    }
    throw "Error fetching bank info";
  },
  cloudinaryApiHandler: async (files, progressCallback) => {
    const { slug }: any = decodeToken();
    const formData = new FormData();
    // only one identity is needed
    formData.append("media", files[0]);
    formData.append("folder", "identity");
    formData.append("kind", "image");
    formData.append("publicId", `${slug}-identity`);
    const response = await multipartFetch("/api/tutors/upload-media", formData);

    if (response.ok) {
      const { data } = await response.json();
      progressCallback(100);
      return data.map((item) => {
        return {
          ...item,
          name: item.public_id,
          secure_url: item.url,
        };
      });
    }
    throw "Failed to upload media";
    // const { data: response } = await axios.post(
    //   "/api/tutors/upload-media",
    //   formData,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${storage.get(NEW_TUTOR_TOKEN, "")}`,
    //       "X-Requested-With": "XMLHttpRequest",
    //     },
    //     onDownloadProgress(progressEvent) {
    //       const percentCompleted = Math.floor(
    //         (progressEvent.loaded * 100) / progressEvent.total
    //       );
    //       progressCallback(percentCompleted);
    //     },
    //   }
    // );
    // response.data.forEach((item) => {
    //   item.name = item.public_id;
    //   item.secure_url = item.url;
    // });
    // return response.data;
  },
  uploadApiHandler: async (files, { folder, unique = false }) => {
    const body = new FormData();
    files.forEach((file) => body.append("media", file));
    body.append("folder", folder);
    const response = await multipartFetch("/api/tutors/upload-media", body);
    if (response.ok) {
      const { data } = await response.json();
      return data;
    }
    throw "Failed to upload media";
  },
  async submitVideoRecording(blob) {
    const { slug }: any = decodeToken();
    const formData = new FormData();
    formData.append("media", blob, `${slug}-video`);
    formData.append("folder", "video-submission");
    formData.append("publicId", `${slug}-video`);
    formData.append("kind", "video");
    const response = await multipartFetch("/api/tutors/upload-media", formData);
    if (response.ok) {
      const { data } = await response.json();
      const [video] = data;
      return {
        id: video.public_id,
        url: video.url,
        quality: video.quality,
      };
    }
    throw "Failed to upload profile pic";
  },
  async uploadAndVerifyProfile(file) {
    const { slug }: any = decodeToken();
    const formData = new FormData();
    formData.append("media", file);
    formData.append("folder", "profile_pics");
    formData.append("kind", "image");
    formData.append("publicId", `${slug}-profile`);
    formData.append("transform", "true");
    formData.append("quality_check", "true");
    formData.append("face_check", "true");
    const response = await multipartFetch("/api/tutors/upload-media", formData);
    if (response.ok) {
      const { data } = await response.json();
      const [image] = data;
      return {
        profile_id: image.public_id,
        url: image.url,
        quality: image.quality,
        has_face: image.has_face,
      };
    }
    throw "Failed to upload profile pic";
  },
  deleteSubject: async (id) => {
    const response = await postFetcher(
      "/api/tutors/delete-tutor-subject",
      { ids: [id] },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      return data;
    }
    throw "Failed to delete tutor subjects";
  },
  deleteBulkSubjects: async (ids, status) => {
    const response = await postFetcher(
      "/api/tutors/delete-tutor-subject",
      { ids },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      return data;
    }
    throw "Failed to delete tutor subjects";
  },
  async buildQuizData(subjectInfo: TuteriaSubjectType) {
    const response = await postFetcher("/api/quiz/generate", subjectInfo, true);
    if (response.ok) {
      const { data } = await response.json();
      let [quizToTake, quizzesList] = data;
      return [quizToTake, quizzesList];
      return data;
    }
    throw "Error building quiz";
  },
  async submitQuizResults(payload) {
    // we do not care about the server response. we just need to send the payload back if the
    // server response was successful.
    let response = await postFetcher("/api/exam/complete", payload, true);
    if (response.ok) {
      let result = await response.json();
      return { payload };
      // return result.data;
    }
    throw "Error grading quiz";
  },
  getTutorSubject,

  loadExistingTutorInfo: () => {
    return storage.get(NEW_TUTOR_INFO);
  },
  loadExistingSubject(subject_id) {
    const tutorSubjects = storage.get(`${CURRENT_SKILL}_${subject_id}`, {});
    if (Object.keys(tutorSubjects).length > 0) {
      return tutorSubjects;
    }
    throw new Error("Missing editing subject");
  },
  saveTutorInfo: async (payload) => {
    const token = storage.get(NEW_TUTOR_TOKEN, "");
    const response = await postFetcher(
      "/api/tutors/save-tutor-info",
      payload,
      true
    );
    // const response = await fetch(`/api/tutors/save-tutor-info`, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });
    if (response.ok) {
      const { data } = await response.json();
      let accessToken = data.accessToken;
      storage.set(NEW_TUTOR_TOKEN, accessToken);
      delete data.accessToken;
      storage.set(NEW_TUTOR_INFO, data);
      return accessToken;
    }
    throw "Failed to save tutor info";
  },
  submitSelectedSubjects: async () => {},
  updateUserPassword: async () => {},
  validateCredentials: () => {
    let data = decodeToken();
    if (data) {
      return cleanTutorInfo(data);
    } else {
      throw "Invalid Credentials";
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
      if ("loginType" in data) {
        return { loggedIn: false, email: data.email, loginType: "code" };
      } else {
        storage.set(FETCHED_TUTOR_KEY, data);
        storage.set(NEW_TUTOR_TOKEN, data.accessToken);
      }
      return {
        loggedIn: true,
        email: data.email,
        tutorData: data,
        accessToken: data.accessToken,
      };
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
        if (!data.redirectUrl) {
          storage.set(FETCHED_TUTOR_KEY, data);
          storage.set(NEW_TUTOR_TOKEN, data.accessToken);
        }
      }
      return data;
    }
    throw "Error submitting";
  },

  async beginQuiz(payload: { subjects: string[] }, subject_data) {
    const tutorToken = storage.get(NEW_TUTOR_TOKEN);
    const response: any = await fetch("/api/quiz/begin", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tutorToken,
      },
      method: "POST",
      body: JSON.stringify({
        payload,
        subject_data: { pk: subject_data.skill_id, ...subject_data.payload },
      }),
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
    body.append("folder", "exhibitions");
    files.forEach(({ file }) => body.append("media", file));
    const response = await multipartFetch("/api/tutors/upload-media", body);
    if (response.ok) {
      const { data } = await response.json();
      data.forEach((item, index) => {
        item.caption = files[index].caption;
      });
      return data.map((o) => ({
        id: o.public_id,
        url: o.url,
        caption: o.caption,
      }));
    }
  },
  remoteDeleteImage: async (data) => {
    const response = await postFetcher(
      "/api/tutors/delete-media",
      {
        id: data.name || data.public_id,
        kind: "image",
      },
      true
    );
    if (response.ok) {
      return await response.json();
    }
    throw "Failed to delete image";
  },
  updateTutorSubjectInfo: async (subject, subject_id) => {
    const response = await postFetcher(
      "/api/tutors/save-subject-info",
      { pk: subject_id, ...subject },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      // const formattedData = {
      //   id: subject_id,
      //   title: subject.heading,
      //   description: subject.description,
      //   certifications: (subject.certifications || []).map((cert) => ({
      //     name: cert.award_name,
      //     institution: cert.award_institution,
      //   })),
      //   teachingStyle: subject.other_info.teachingStyle,
      //   trackRecords: subject.other_info.trackRecords,
      //   teachingRequirements: subject.other_info.teachingRequirements,
      //   preliminaryQuestions: subject.other_info.preliminaryQuestions,
      //   exhibitions: subject.exhibitions.map((exhibition) => ({
      //     id: exhibition.image,
      //     caption: exhibition.caption,
      //   })),
      // };
      // saveSubject(subject_id, formattedData);
      clearSubjectDescription();
      return data;
    }
    throw "Failed to save subject details";
  },
  initializeApplication,
  async sendEmailVerification({ email, code }) {
    const response = await postFetcher("/api/login", { email, code }, false);
    if (response.ok) {
      const { data } = await response.json();
      if (code) {
        return { verified: true };
      } else {
        return data;
      }
    }
    throw "Error verifying email";
  },
  async updateLoggedInStatus() {
    try {
      const {
        accessToken,
        tutorData: x,
        tutorSubjects,
        redirectUrl,
      } = await getTutorInfo(true);
      let tutorData = { accessToken, tutorData: x, tutorSubjects };
      storage.set(FETCHED_TUTOR_KEY, tutorData);
      return {
        loggedIn: true,
        email: x?.personalInfo?.email || "",
        tutorData: tutorData.tutorData,
        accessToken,
        redirectUrl,
      };
    } catch (error) {
      return { loggedIn: false, email: "" };
    }
  },
  saveOnBlur: (name, value) => {
    storage.set(name, value);
  },
  loadSubjectDescription: (name) => {
    return storage.get(name, "");
  },

  buildPreferences(subject: { category: string; [key: string]: any }) {
    const placeholder = "$subject_name";
    const preferences = seshStorage.get(TUTERIA_PREFERENCE_KEY, []);
    const result = preferences
      .filter(({ category }) => category === subject.category)
      .map((preference) => {
        for (let key in preference) {
          const value = preference[key];
          if (typeof value === "string" && value.includes(placeholder)) {
            preference[key] = value.replace(placeholder, subject.name);
          }
          if (
            preference.category === "Test Prep" &&
            key === "name" &&
            ["modules", "test_results"].includes(preference[key])
          ) {
            preference.options = subject.preferenceOptions;
          }
        }
        return preference;
      });
    return result;
  },
  async checkSpellingAndGrammar(checks) {
    const response = await postFetcher(
      "/api/tutors/spell-check",
      { checks },
      true
    );
    if (response.ok) {
      const {
        data: { data, hasError },
      } = await response.json();
      if (hasError) {
        throw data;
      }
    }
    throw "Error verifying email";
  },
  getEarningPercentage() {
    let tutorInfo = this.loadExistingTutorInfo();
    let others = tutorInfo?.others || {};
    let isPremium = others?.premium;
    return isPremium ? 75 : 70;
  },
  async getPriceSuggestion(subject: string) {
    return {
      minimum: "1750",
      maximum: "3600",
      recommended: "2750",
    };
  },
  async validatePersonalInfo(formValues) {
    console.log({ formValues });
    const response = await postFetcher(
      "/api/tutors/validate-personal-info",
      formValues,
      true
    );
    if (response.ok) {
      const {
        data: { data, hasError },
      } = await response.json();
      if (hasError) {
        throw { formErrors: data };
      }
    }
  },
  onLogout() {
    window.localStorage.clear();
  },
};
