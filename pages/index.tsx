import { Box, Text } from "@chakra-ui/react";
import React from "react";
import TutorPageWrapper from "@tuteria/shared-lib/src/tutor-revamp";

export const WorkHistory = () => {
  const formRef = React.useRef<any>();
  return (
    <Box
      m="10px auto"
      w="100%"
      shadow="0 0 2px 2px rgb(0 0 0 / 15%)"
      borderRadius=".25rem"
      maxW="600px"
    >
      <Text>Hello world</Text>
    </Box>
  );
};

export default WorkHistory;
