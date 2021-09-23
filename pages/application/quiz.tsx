import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import QuizStore from "@tuteria/shared-lib/src/tutor-revamp/quizzes/quizStore";
import QuizPageComponent from "@tuteria/shared-lib/src/tutor-revamp/quizzes/QuizPage";
import { adapter } from '../../server_utils/client';

const store = QuizStore.create({}, { adapter });

export default function QuizPage() {
  // const router = useRouter();
  // const { query: { subject } } = router;

  // useEffect(() => {
  //   store.setTestSubject(subject);
  // }, []);

  // const navigate = () => {
  //   if (store.quizResults.passedQuiz) {
  //     router.push('/application');
  //   } else {
  //     router.push('/subject');
  //   }
  // }

  // return (
  //   <QuizPageComponent
  //     index={0}
  //     navigate={navigate}
  //     store={store}
  //   />
  // );
  return (
    <p>This is the Quiz Page 🙄</p>
  )
}