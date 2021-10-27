import Login from "@tuteria/shared-lib/src/tutor-application/Login";
import React from "react";
import { clientAdapter } from "../server_utils/client";
import { usePrefetchHook } from "../server_utils/util";

export default function LoginPage({ email, next }) {
  const { navigate } = usePrefetchHook({ routes: [next] });
  const showOTP = email ? true : false;
  async function authenticateUser(data) {
    await clientAdapter.authenticateUser(data);
    navigate(next);
  }

  return <Login email={email} showOTP={showOTP} onLogin={authenticateUser} />;
}

export async function getServerSideProps({ query }) {
  const email = query.email || "";
  const next = query.next || "/apply";

  return { props: { email, next } };
}
