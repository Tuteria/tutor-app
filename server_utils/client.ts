export const adapter = {
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
  // fetchQuizQuestions: async (quizSubjects: any) => {
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve({ quiz: DATA.quiz, quizSubjects });
  //     }, 2000);
  //   });
  // },
  toNextPath: async () => { },
};