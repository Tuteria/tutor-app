import { LoadingState } from "@tuteria/shared-lib/src/components/data-display/LoadingState";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { clientAdapter, NEW_TUTOR_TOKEN } from "../server_utils/client";

const Admin = () => {
  const router = useRouter()
  const { c } = router.query;
  useEffect(() => {
    if (c) {
      console.log(router)
      clientAdapter.storage.set(NEW_TUTOR_TOKEN, c)
      router.push('/apply')
    }
  }, [c])

  return (
    <div>
      <LoadingState />
    </div>
  )
}

export default Admin