import { useEffect } from "react";
import { NextRouter, useRouter } from "next/router";
import { useToast } from "@chakra-ui/react";
import getConfig from "next/config";
import { format } from "url";
import { APPLICATION_STEPS } from "@tuteria/shared-lib/src/stores/rootStore";

const { publicRuntimeConfig } = getConfig() || {};

function push(router, url, shallow = false, same = true) {
  let newUrl = `${publicRuntimeConfig.basePath || ""}${format(url)}`;
  const as = same ? newUrl : undefined;
  router.push(newUrl, as, { shallow });
}

export const usePrefetchHook = ({
  routes = [],
  base = "",
  key = "",
  keyFunc = (router) => "",
}) => {
  const toast = useToast();
  let rootBase = key;
  let router = useRouter();
  if (keyFunc) {
    rootBase = keyFunc(router);
  }
  useEffect(() => {
    routes.forEach((route) => {
      router?.prefetch(`${base}${rootBase}${route}`);
    });
  }, [routes.length]);
  const navigate = (path, same = true) => {
    push(router, `${base}${rootBase}${path}`, true, same);
  };
  function onError(error: any, title = "An error occured") {
    if (error === "Invalid Credentials") {
      const { pathname, search } = window.location;
      navigate(`/login?next=${`${pathname}${search}`}`);
    } else {
      toast({
        title,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      throw error;
    }
  }
  function buildNavigation(accessToken, tutorData) {
    const paths = {
      [APPLICATION_STEPS.APPLY]: `/apply?currentStep=personal-info`,
      [APPLICATION_STEPS.VERIFY]: `/verify`,
      [APPLICATION_STEPS.SUBJECT]: `/subjects?access_token=${accessToken}`,
      [APPLICATION_STEPS.COMPLETE]: `/complete?access_token=${accessToken}`,
      [APPLICATION_STEPS.TUTOR_PREFERENCES]: `/preferences?access_token=${accessToken}`,
      [APPLICATION_STEPS.TERMS]: `/terms?access_token=${accessToken}`,
      [APPLICATION_STEPS.VERIFIED_TUTOR]: `/application-verified?access_token=${accessToken}`,
    };
    let step = tutorData?.appData?.currentStep || APPLICATION_STEPS.APPLY;
    return paths[step];
  }

  return { navigate, router, onError, toast, buildNavigation };
};
