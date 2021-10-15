import CompletedApplicationPage from "@tuteria/shared-lib/src/tutor-revamp/CompletedApplicationPage";
import React from "react";
import { getUserInfo, serverAdapter } from "../server_utils/server";

export default function CompletedPage({ tutorInfo }: any) {
  return (
    <CompletedApplicationPage
      firstName={tutorInfo.personalInfo.first_name}
      isPremium={true}
      photo="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&crop=faces&fit=crop&h=200&w=200"
    />
  );
}

export async function getServerSideProps({ query, res }) {
  const access_token = query.access_token || "";
  try {
    if (access_token) {
      let userInfo = getUserInfo(access_token);
      let tutorInfo = await serverAdapter.getTutorInfo(
        userInfo.personalInfo.email
      );
      return { props: { tutorInfo } };
    } else {
      throw new Error("not allowed");
    }
  } catch (error) {
    res.writeHead(302, {
      Location: `/`,
    });
    res.end();
  }
}
