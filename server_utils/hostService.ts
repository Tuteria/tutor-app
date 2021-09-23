import allCountries from "@tuteria/mobile-lib/src/data/countries.json";
import allRegions from "@tuteria/mobile-lib/src/data/regions.json";

export let HOST = process.env.HOST_ENDPOINT || "http://backup.tuteria.com:8000";
export let DEV = (process.env.IS_DEVELOPMENT || "development") == "development";
const NOTIFICATION_SERVICE =
  process.env.NOTIFICATION_SERVICE || "http://email-service.tuteria.com:5000";
const SCHEDULER_SERVICE =
  process.env.SCHEDULER_SERVICE || "http://email-service.tuteria.com:8092";
export const IS_TEST = process.env.IS_TEST || "true";
let ADMIN_EMAIL = process.env.ADMIN_EMAIL;
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_NUMBER = process.env.TEST_NUMBER || "";

export const saveTutorInfoService = async ({
  slug,
  data,
}: {
  slug: string;
  data: { [key: string]: any };
}) => {
  const response = await postHelper('/api/tutors/save-tutor-info', { slug, data });
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error('Failed to save tutor info');
};

export const getTutorInfoService = async (tutorId: string) => {
  return {
    userIsloggedIn: true,
    locationInfo: {
      country: "Nigeria",
      regions: allRegions,
      countries: allCountries,
      state: "Lagos",
      region: "Gbagada",
      vicinity: "Charley boy Busstop",
      address: "10, Lanre awolokun street",
    },
    personalInfo: {
      firstName: "Abiola",
      lastName: "Oyeniyi",
      email: "james@example.com",
      gender: "female",
      country: "Nigeria",
      dateOfBirth: "1998-10-12",
      phone: "2347035209922",
      whatsappNo: "2348152957065",
      state: "Lagos",
      vicinity: "Charley boy Busstop",
      region: "Gbagada",
      address: "Irabor Street Koto",
      primaryLanguage: "English",
      medium: "Facebook",
    },
    educationWorkHistory: {
      educations: [
        {
          school: "Ikeja Grammar school",
          country: "Nigeria",
          course: "Chemistry",
          degree: "MBBS",
          speciality: "Mathematics",
          startYear: "2006",
          endYear: "2020",
          grade: "First Class",
        },
        {
          school: "University of Lagos",
          country: "Nigeria",
          course: "Organic Chemistry",
          speciality: "Mathematics",
          degree: "MBBS",
          startYear: "2006",
          endYear: "2020",
          grade: "First Class",
        },
      ],
      workHistories: [
        {
          company: "Tuteria Limited",
          role: "CEO",
          isTeachingRole: false,
          startYear: "2015",
          endYear: "2020",
          isCurrent: true,
          showOnProfile: true,
        },
      ],
    },
    subject: {
      tutorSubjects: [
        {
          id: 1,
          name: "General Mathematics",
          category: "Academics",
          subcategory: "Secondary",
          status: "not-started",
        },
        {
          id: 2,
          name: "English",
          category: "Academics",
          subcategory: "Secondary",
          status: "not-started",
        },
        {
          id: 3,
          name: "French",
          category: "Academics",
          subcategory: "Secondary",
          status: "denied",
        },
        {
          id: 4,
          name: "Spanish",
          category: "Academics",
          subcategory: "Secondary",
          status: "denied",
        },
        {
          id: 5,
          name: "Recognition",
          category: "Academics",
          subcategory: "Primary",
          status: "not-started",
        },
        {
          id: 5,
          name: "Aptitude",
          category: "Academics",
          subcategory: "Adult",
          status: "pending",
        },
        {
          id: 6,
          name: "Speaking",
          category: "Exam Prep",
          subcategory: "IELTS",
          status: "in-progress",
        },
        {
          id: 7,
          name: "Listening",
          category: "Exam Prep",
          subcategory: "IELTS",
          status: "active",
        },
      ],
    },
    identity: {
      profilePhotoId: "hello/holla",
      profilePhoto:
        "https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=aa3a807e1bbdfd4364d1f449eaa96d82",
      isIdVerified: true,
    },
    slug: tutorId,
  }
};

async function postHelper(url, data, base = HOST) {
  const response = await fetch(`${base}${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
  return response;
}

export async function sendEmailNotification(data) {
  let datToSend = data;
  if (IS_TEST === "true") {
    datToSend.to = [TEST_EMAIL];
  }

  const response = await fetch(`${NOTIFICATION_SERVICE}/send_message/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(datToSend)
  });
  const result = await response.json();
  return result;
}

export async function authenticateLoginDetails(data) {
  const response = await postHelper('/new-subject-flow/login', data);
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error("Error authenticating user");
}

export async function saveTutorSubjectService(data: any) {
  const response = await postHelper('/api/tutors/save-tutor-subject', data);
  if (response.ok) {
    const { data } = await response.json();
    return data;
  }
  throw new Error("Failed to save tutor subject");
}