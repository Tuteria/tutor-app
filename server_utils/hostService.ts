import { getSpellCheckDetails } from "@tuteria/tuteria-data/src";

export let HOST = process.env.HOST_ENDPOINT || "http://backup.tuteria.com:8000";
export const IS_DEVELOPMENT = process.env.IS_DEVELOPMENT || "development";
export let DEV = IS_DEVELOPMENT === "development";
export const API_TEST = process.env.DEVELOPER_ACCESS === "true" || false;
const NOTIFICATION_SERVICE =
  process.env.NOTIFICATION_SERVICE || "http://email-service.tuteria.com:5000";
const SCHEDULER_SERVICE =
  process.env.SCHEDULER_SERVICE || "http://email-service.tuteria.com:8092";
const SHEET_HOST_URL =
  process.env.SHEET_HOST_URL || "https://sheet.tuteria.com";
const SPELL_CHECK_URL =
  process.env.SPELL_CHECK_URL || "https://gsheet.vercel.app";

export const IS_TEST = process.env.IS_TEST || "true";
let ADMIN_EMAIL = process.env.ADMIN_EMAIL;
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_NUMBER = process.env.TEST_NUMBER || "";

export async function bulkCreateQuizOnBackend(
  data: Array<{
    skill?: string;
    pass_mark?: number;
    url?: string;
    questions: Array<{
      pretext?: string;
      question?: string;
      image?: string;
      optionA?: string;
      optionB?: string;
      optionC?: string;
      optionD?: string;
      answer?: string;
      shared_text?: string;
      shared_question?: string;
      shared_images?: string;
      options_layout?: string;
      image_layout?: string;
      is_latex?: string;
    }>;
  }>,
  refresh = false
): Promise<
  Array<{
    name: string;
    testable: boolean;
    quiz_url: string;
    id: number;
    slug: string;
    passmark: number;
    duration: number;
    is_new: boolean;
    questions: any[];
  }>
> {
  let url = `${HOST}/api/ensure-quiz-creation/`;
  let payload: any = { info: data };
  if (refresh) {
    url = `${HOST}/api/repopulate-quiz/`;
    payload = data[0];
  }
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (response.status < 500) {
    let result = await response.json();
    if (result.status) {
      return result.data;
    }
    return result;
  }
  throw new Error("Error creating subjects from backend.");
}

export async function fetchAllowedQuizesForUser(email: string): Promise<
  Array<{
    name: string;
    testable: boolean;
    quiz_url: string;
    id: number;
    slug: string;
    passmark: number;
    duration: number;
    is_new: boolean;
  }>
> {
  let response = await fetch(`${HOST}/api/get-quizzes/?email=${email}`, {});
  if (response.status < 500) {
    let result = await response.json();
    if (result.status) {
      return result.data.filter((o) => o.testable);
    }
    return result;
  }
  throw new Error("Error fetching quizes for user");
}

export const saveTutorInfoService = async ({
  slug,
  data,
}: {
  slug: string;
  data: { [key: string]: any };
}) => {
  const response = await postHelper("/api/tutors/save-tutor-info", {
    slug,
    data,
  });
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error("Failed to save tutor info");
};

async function postHelper(url, data, base = HOST) {
  const response = await fetch(`${base}${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response;
}

export async function sendEmailNotification(data) {
  let datToSend = data;
  if (IS_DEVELOPMENT === "development") {
    console.log(data);
  } else if (IS_DEVELOPMENT === "staging") {
    // datToSend.to = [TEST_EMAIL];
    // if (datToSend.sms_options) {
    //   datToSend.sms_options.receiver = TEST_NUMBER;
    // }
  }
  if (IS_DEVELOPMENT !== "development") {
    const response = await fetch(`${NOTIFICATION_SERVICE}/send_message/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datToSend),
    });
    console.log(datToSend);
    const result = await response.json();
    return result;
  }
}

export async function authenticateLoginDetails(data) {
  const response = await postHelper("/new-subject-flow/login", data);
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error("Error authenticating user");
}

export const getQuizData = async (quiz_url: string) => {
  const response = await fetch(`${HOST}/api/questions/${quiz_url}`);
  if (response.status < 500) {
    let result = await response.json();
    return result;
  }
  throw new Error("Error fetching quiz from backend.");
};

export const beginQuiz = async (data: {
  email: string;
  subjects: string[];
}) => {
  const response = await fetch(`${HOST}/new-subject-flow/begin-quiz`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  if (response.status < 500) {
    let { data } = await response.json();
    return data;
  }
  throw new Error("Error starting quiz from backend.");
};

export const updateTestStatus = async (data: {
  email: string;
  name?: string;
  passed: Array<{ score: number; skill: string }>;
  failed: Array<{ score: number; skill: string }>;
}) => {
  const response = await fetch(`${HOST}/new-subject-flow/update-quiz`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  if (response.status < 500) {
    let result = await response.json();
    return result.data;
  }
  throw new Error("Error updating test status from backend.");
};

export type TuteriaSubjectServerResponse = Array<{
  pk: number;
  skill: { name: string };
  status: number;
  heading?: string;
  description?: string;
  price?: string;
  has_updated_price: boolean;
  certifications: any[];
  sittings: any[];
  exhibitions: Array<{ image: string; url: string; caption: string }>;
  other_info?: {
    teachingStyle: string;
    trackRecords: string;
    teachingRequirements: string;
    preliminaryQuestions: string;
  };
}>;

export const saveUserSelectedSubjects = async (data: {
  email: string;
  subjects: string[];
}): Promise<TuteriaSubjectServerResponse> => {
  let response = await fetch(`${HOST}/new-subject-flow/select-subjects`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  if (response.status < 500) {
    let result = await response.json();
    if (result.status) {
      let { object_list } = result.data;
      return object_list;
    }
    return result;
  }
  throw new Error("Error saving selected-subjects");
};

export const userRetakeTest = async (data: {
  email: string;
  subjects: string[];
}) => {
  let response = await fetch(`${HOST}/new-subject-flow/retake-quiz`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  if (response.status < 500) {
    let result = await response.json();
    if (result.status) {
      return result.data;
    }
    return result;
  }
  throw new Error("Error allowing user to retake test");
};

export async function fetchAllCountries() {
  let countryData = await import("../data/countries.json");
  let allCountries = countryData.default;
  return allCountries;
}

export async function deleteTutorSubject(data: {
  email: string;
  ids: number[];
}) {
  const response = await fetch(`${HOST}/new-subject-flow/delete-subject`, {
    headers: { "content-type": "application/json" },
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error("Failed to delete tutor subject");
}
export async function saveTutorSubjectService(data: any) {
  const response = await postHelper("/api/tutors/save-tutor-subject", data);
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error("Failed to save tutor subject");
}

export async function saveTutorSubjectInfo(subject: {
  pk: number;
  skill: { name: string };
  heading: string;
  description: string;
  price: number;
  teachingRequirements: string[];
  certifications: { award_name: string; award_institution: string };
}) {
  let response = await fetch(`${HOST}/new-flow/save-tutor-subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subject),
  });
  if (response.status < 400) {
    let data = await response.json();
    return data.data;
  }
  throw new Error("Error saving subject details");
}

export async function getBanksSupported(supportedCountry: string) {
  let countryData = await import("@tuteria/shared-lib/src/data/banks.json");
  let bankdDetails = countryData.default[supportedCountry] || [];
  return bankdDetails;
}

export async function checkSpellingAndGrammar(
  text: string,
  other_texts: string[]
) {
  let server_config = await getSpellCheckDetails();
  let response = await postHelper(
    "/sc/evaluate",
    { text, other_texts, server_config },
    SPELL_CHECK_URL
  );
  if (response.ok) {
    let result = await response.json();
    return result.data;
  }
  throw new Error("Failed to run check");
}
