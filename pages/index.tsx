import LandingPage from "@tuteria/shared-lib/src/tutor-application/pages/LandingPage";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { usePrefetchHook } from "../server_utils/util";

export default function Index() {
  const { navigate } = usePrefetchHook({ routes: ["/login"] });

  const onSubmit = async (data: { email: string }) => {
    try {
      const { redirectUrl } = await clientAdapter.beginTutorApplication(data);
      navigate(redirectUrl);
    } catch (e) {
      throw e;
    }
  };
  return <LandingPage onSubmit={onSubmit} />;
}
