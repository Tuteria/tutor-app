import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { RootStore } from "@tuteria/shared-lib/src/stores";
import { adapter } from "../../server_utils/client";
import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import TestPageComponent from "@tuteria/shared-lib/src/tutor-revamp/TestPage";

const store = RootStore.create({}, { adapter });

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { query: { subject } } = router

  const navigateToQuiz = () => {
    router.push(`/application/quiz?subject=${subject}`);
  }

  useEffect(() => {
    if (subject) {
      store.subject.setTestSubject(subject as string);
      if (store.subject.listOfTestableSubjects.length === 0) {
        setIsLoading(true);
        store.subject.fetchQuizQuestions().then((res) => navigateToQuiz());
      } else  { setIsLoading(false) }
    }
  }, [subject]);

  if (isLoading) {
    return <LoadingState text="Fetching questions..." />;
  }

  return (
    <TestPageComponent
      store={store}
      navigateBack={() => router.push('/application')}
      navigateToQuiz={navigateToQuiz}
    />
  )
}