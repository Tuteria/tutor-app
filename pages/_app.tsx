import React from "react";
import Head from "next/head";
import "react-phone-input-2/lib/style.css";
// import App from "next/app";
import ZetaProvider from "@tuteria/shared-lib/src/bootstrap";
require("react-dom");
if (typeof window !== "undefined") {
  window.React2 = require("react");
  console.log(window.React1 === window.React2);
}
const MyApp = ({ Component, pageProps }) => {
  // console.log(pageProps);
  return (
    <ZetaProvider>
      <>
        <Head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
          />
          <meta name="description" content="Description" />
          <meta name="keywords" content="Keywords" />
          <title>Next.js PWA Example</title>

          <link rel="manifest" href="/manifest.json" />
          <link
            href="/icons/favicon-16x16.png"
            rel="icon"
            type="image/png"
            sizes="16x16"
          />
          <link
            href="/icons/favicon-32x32.png"
            rel="icon"
            type="image/png"
            sizes="32x32"
          />
          <link rel="apple-touch-icon" href="/apple-icon.png"></link>
          <meta name="theme-color" content="#317EFB" />
        </Head>
        {/* <DefaultSeo {...seo} /> */}
        <Component {...pageProps} />
      </>
    </ZetaProvider>
    // <Component {...pageProps} />
  );
};

// MyApp.getInitialProps = async appContext => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//   console.log(appProps.pageProps);
//   return { ...appProps };
// };

export default MyApp;
