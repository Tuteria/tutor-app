import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { clientAdapter, NEW_TUTOR_TOKEN } from "../server_utils/client";

const Admin = ({ c, current_step }) => {
  const router = useRouter();
  // const { c, current_step = "apply" } = router.query;
  useEffect(() => {
    if (c) {
      console.log(router);
      clientAdapter.storage.set(NEW_TUTOR_TOKEN, c);
      router.push(`/${current_step}?access_token=${c}&force=true`);
    }
  }, [c]);

  return (
    <div>
      <LoadingState />
    </div>
  );
};

export async function getServerSideProps({ query, res }) {
  const access_token = query.c || "";
  const current_step = query.current_step || "apply";
  return {
    props: { c: access_token, current_step },
  };
}

export default Admin;
