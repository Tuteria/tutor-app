import { useEffect} from 'react';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import { format } from 'url';

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
    keyFunc = router => ""
  }) => {
    let rootBase = key;
    let router = useRouter();
    if (keyFunc) {
      rootBase = keyFunc(router);
    }
    useEffect(() => {
      routes.forEach(route => {
        router.prefetch(`${base}${rootBase}${route}`);
      });
    }, [routes.length]);
    const navigate = (path, same = true) => {
      push(router, `${base}${rootBase}${path}`, true, same);
    };
  
    return { navigate, router };
  };