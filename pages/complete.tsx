import React from 'react';
import CompletedApplicationPage from "@tuteria/shared-lib/src/tutor-revamp/CompletedApplicationPage";

export default function CompletedPage() {
  return (
    <CompletedApplicationPage
      isPremium
      firstName="Elliot"
      photo="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&crop=faces&fit=crop&h=200&w=200"
    />
  );
}