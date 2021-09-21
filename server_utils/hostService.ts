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
  }>
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
  }>
> {
  let response = await fetch(`${HOST}/api/ensure-quiz-creation/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ info: data }),
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
      return result.data;
    }
    return result;
  }
  throw new Error("Error fetching quizes for user");
}

export const saveTutorInfoService = async ({
  tutorId,
  type,
  data,
}: {
  tutorId: string;
  type: string;
  data: { [key: string]: any };
}) => {
  return { slug: tutorId, type, data };
};

export const getTutorInfoService = async (tutorId: string) => {
  return {
    slug: tutorId,
    locationInfo: {
      country: "Nigeria",
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
    },
    educationWorkHistory: {
      educations: [
        {
          school: "Ikeja Grammar school",
          country: "Nigeria",
          course: "Chemistry",
          degree: "MBBS",
          startYear: "2006",
          endYear: "2020",
          grade: "First Class",
        },
        // {
        //   school: "University of Lagos",
        //   country: "Nigeria",
        //   course: "Organic Chemistry",
        //   degree: "MBBS",
        //   startYear: "2006",
        //   endYear: "2020",
        //   grade: "First Class",
        // },
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
    // teachingProfile: {
    //   classGroup: ["Lower Primary", "Pre-primary"],
    //   curriculums: ["British", "Nigerian"],
    //   examExperience: {
    //     exams: [
    //       "Common Entrance Exam",
    //       "Cambridge Checkpoint",
    //       "13+ Entrance Exam",
    //     ],
    //     schools: ["Greensprings", "Grange"],
    //   },
    //   specialNeeds: ["ADD/ADHD", "Dyslexia"],
    //   tutorDisabilities: ["ADD/ADHD"],
    //   onlineProfile: {
    //     acceptsOnline: true,
    //     hasComputer: true,
    //     hasInternet: true,
    //   },
    // },
    // availability: {
    //   availability: {
    //     Monday: ["Morning", "Late afternoon"],
    //     Wednesday: ["Evening", "Early evening"],
    //   },
    //   maxDays: 3,
    //   maxHours: 1,
    //   maxStudents: 3,
    // },
    identity: {
      profilePhotoId: "hello/holla",
      profilePhoto:
        "https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=aa3a807e1bbdfd4364d1f449eaa96d82",
      isIdVerified: true,
      // uploadStore: {
      //   files: [
      //     {
      //       name: "sample.png",
      //       url:
      //         "https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=aa3a807e1bbdfd4364d1f449eaa96d82",
      //     },
      //   ],
      // },
    },
    // agreement: {
    //   lessonPercent: true,
    //   amountEarned: 567650,
    //   contractAgreement: true,
    //   taxP: 5,
    // },
  };
};

export const getTestQuestions = async (subject) => {
  try {
    const response = await fetch(`${HOST}/api/questions/${subject}`,{
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body : JSON.stringify({subject})
    })
    const data = await response.json()
  } catch (error) {
    throw error
  }
}
