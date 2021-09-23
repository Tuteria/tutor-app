import DATA from "@tuteria/shared-lib/src/tutor-revamp/quizzes/sample-quiz-data";

export const adapter = {
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
};