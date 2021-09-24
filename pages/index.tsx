import { Box, Button, Input, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import { usePrefetchHook } from '../server_utils/util';
import { adapter } from '../server_utils/client';

export default function Index() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { navigate } = usePrefetchHook({ routes: ['/login'] });

  const onSubmit = async (e) => {
    try {
      setIsLoading(true);
      e.preventDefault();
      await adapter.onEmailSubmit({ email });
      navigate(`/login?email=${email}`)
    } catch (e) {
      alert('Problem!!!');
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <Box m="10px auto" w="100%" maxW="600px">
      <Text>Welcome to the Landing Page.</Text>
      <Box>
        <form onSubmit={onSubmit}>
          <Box mb="10px">
            <Input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              required
            />
          </Box>
          <Button colorScheme="blue" isLoading={isLoading} type="submit">
            Save
          </Button>
        </form>
      </Box>
    </Box>
  );
}
