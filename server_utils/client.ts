import axios from "axios";
import {
  AdapterType,
  ServerAdapterType,
} from "@tuteria/shared-lib/src/adapter";
import storage from "@tuteria/shared-lib/src/local-storage";
import jwt_decode from "jwt-decode";
import { TuteriaSubjectType } from "./types";

const NEW_TUTOR_TOKEN = "NEW_TUTOR_TOKEN";
const TUTOR_QUIZZES = "TUTOR-QUIZZES";
const TUTERIA_SUBJECTS_KEY = "TUTERIA_SUBJECTS";
const CURRENT_SKILL = "TUTERIA_SKILL";

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
    const { tutorData, tutorSubjects, supportedCountries, accessToken } = data;
    storage.set(NEW_TUTOR_TOKEN, accessToken);
    return { tutorData, tutorSubjects, supportedCountries, accessToken };
  }
  if (response.status === 403) {
    throw "Invalid Credentials";
  }
  throw "Error getting tutor info";
}
async function initializeApplication(
  adapter: AdapterType,
  { regions, countries, supportedCountries, educationData, tuteriaSubjects }
) {
  const { accessToken, tutorData, tutorSubjects } = await getTutorInfo(
    tuteriaSubjects.length > 0
  );
  storage.set(adapter.regionKey, regions);
  storage.set(adapter.countryKey, countries);
  storage.set(adapter.tuteriaSubjectsKey, tuteriaSubjects);
  storage.set(adapter.supportedCountriesKey, supportedCountries);
  return {
    tutorInfo: tutorData,
    accessToken,
    subjectData: { tutorSubjects, tuteriaSubjects },
    staticData: {
      regions,
      countries,
      supportedCountries,
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

const modifyExistingSubject = (subject_id, subject) => {
  storage.set(`${CURRENT_SKILL}_${subject_id}`, subject);
};
export const clientAdapter: any = {
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
    const formData = new FormData();
    files.forEach((file) => formData.append("media", file));
    formData.append("folder", "identity");
    const { data: response } = await axios.post(
      "/api/tutors/upload-media",
      formData,
      {
        headers: {
          Authorization: `Bearer ${storage.get(NEW_TUTOR_TOKEN, "")}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        onDownloadProgress(progressEvent) {
          const percentCompleted = Math.floor(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          progressCallback(percentCompleted);
        },
      }
    );
    response.data.forEach((item) => {
      item.name = item.public_id;
      item.secure_url = item.url;
    });
    return response.data;
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
  async uploadAndVerifyProfile(file) {
    const { slug }: any = decodeToken();
    const formData = new FormData();
    formData.append("media", file);
    formData.append("folder", "profile_pics");
    formData.append("publicId", `${slug}-profile`);
    formData.append("transform", "true");
    const response = await multipartFetch("/api/tutors/upload-media", formData);
    if (response.ok) {
      const { data } = await response.json();
      const [image] = data;
      return {
        profile_id: image.public_id,
        url: image.url,
        quality: image.quality,
      };
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
  // async getTutorSubjects(subjectInfo?: TuteriaSubjectType) {
  //   let tutorSubjects = [];
  //   let tuteriaSubjects = [];
  //   let quizzesAllowed = [];
  //   try {
  //     let response = await getFetcher("/api/tutors/get-tutor-subjects", true);
  //     if (response.ok) {
  //       let {
  //         data: { skills, allowedQuizzes },
  //       } = await response.json();
  //       tutorSubjects = skills;
  //       quizzesAllowed = allowedQuizzes;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     throw "Error fetching tutor subjects";
  //   }
  //   if (subjectInfo) {
  //     if (subjectInfo?.pk) {
  //       storage.set(TUTOR_SUBJECTS, tutorSubjects);
  //       const foundTutorSubject = tutorSubjects.find(
  //         (subject) => subject.id === subjectInfo.pk
  //       );
  //       return { tutorSubjects: [foundTutorSubject] };
  //     }
  //     const rr = {
  //       tutorSubjects: tutorSubjects
  //         .filter(
  //           (o) => o.name.toLowerCase() === subjectInfo.name.toLowerCase()
  //         )
  //         .map((_tSubject) => {
  //           // let quizzes = subjectInfo.subjects.filter((x) =>
  //           //   quizzesAllowed
  //           //     .map((o) => o.name.toLowerCase())
  //           //     .includes(x.name.toLowerCase())
  //           // );
  //           const quizzes = subjectInfo.subjects;
  //           return { ..._tSubject, quizzes };
  //         }),
  //       tuteriaSubjects,
  //     };
  //     return rr;
  //   }
  //   return { tutorSubjects, tuteriaSubjects };
  // },

  loadExistingTutorInfo: () => {
    return decodeToken();
  },
  saveSubject(subject_id, subject) {
    storage.set(`${CURRENT_SKILL}_${subject_id}`, subject);
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
      storage.set(NEW_TUTOR_TOKEN, data.accessToken);
      return data.accessToken;
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
  // async generateQuiz(payload: TuteriaSubjectType) {
  //   const tutorToken = storage.get(NEW_TUTOR_TOKEN);
  //   const response = await fetch("/api/quiz/generate", {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + tutorToken,
  //     },
  //     method: "POST",
  //     body: JSON.stringify(payload),
  //   });
  //   const { data } = await response.json();
  //   storage.set(TUTOR_QUIZZES, data);
  //   return data;
  // },
  async beginQuiz(payload: { subjects: string[] }) {
    const tutorToken = storage.get(NEW_TUTOR_TOKEN);
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
    body.append("folder", "exhibitions");
    // files.forEach(({ file }) => body.append("media", file));
    const filteredFiles = files.filter(({ file }) => file);
    filteredFiles.forEach(({ file }) => body.append("media", file));
    const response = await multipartFetch("/api/tutors/upload-media", body);
    if (response.ok) {
      const { data } = await response.json();
      data.forEach((item, index) => {
        item.caption = filteredFiles[index].caption;
      });
      return data.map((o) => ({
        id: o.public_id,
        url: o.url,
        caption: o.caption,
      }));
    }
  },
  updateTutorSubjectInfo: async (subject, subject_id) => {
    const response = await postFetcher(
      "/api/tutors/save-subject-info",
      { pk: subject_id, ...subject },
      true
    );
    if (response.ok) {
      const { data } = await response.json();
      const formattedData = {
        id: subject_id,
        title: subject.heading,
        description: subject.description,
        certifications: (subject.certifications || []).map((cert) => ({
          name: cert.award_name,
          institution: cert.award_institution,
        })),
        teachingStyle: subject.other_info.teachingStyle,
        trackRecords: subject.other_info.trackRecords,
        teachingRequirements: subject.other_info.teachingRequirements,
        preliminaryQuestions: subject.other_info.preliminaryQuestions,
        // exhibitions: subject.exhibitions.map((j) => ({
        //   image: j.id,
        //   caption: j.caption,
        // })),
        exhibitions: [],
      };
      modifyExistingSubject(subject_id, formattedData);
      return data;
    }
    throw "Failed to save subject details";
  },
  initializeApplication,
  async initializeSubject(
    adapter: AdapterType,
    subjectInfo: TuteriaSubjectType,
    key = "name"
  ) {
    let response = await initializeApplication(adapter, {
      regions: [],
      countries: [],
      tuteriaSubjects: [1],
    });
    let foundSubject = getTutorSubject(
      response.subjectData.tutorSubjects,
      subjectInfo,
      key,
      "edit"
    );
    if (foundSubject) {
      storage.set(`${CURRENT_SKILL}_${foundSubject.id}`, foundSubject);
    }
    response.subjectData.tuteriaSubjects = [];
    return { foundSubject, response };
  },
};
