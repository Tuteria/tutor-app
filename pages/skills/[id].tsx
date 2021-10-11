import React from "react";

const SubjectDetailView = () => {
  return <div>Hello subject</div>;
};

export default SubjectDetailView;

export async function getServerSideProps({}) {
  return { props: {} };
}
