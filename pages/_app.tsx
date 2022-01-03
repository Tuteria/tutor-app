// @ts-nocheck
import React from "react";
import Head from "next/head";
import "react-phone-input-2/lib/style.css";
import "katex/dist/katex.min.css";
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
          <title>Tuteria Tutor Application</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.json" />
         
          <link rel="apple-touch-icon" href="/apple-icon.png"></link>
          <meta name="theme-color" content="#317EFB" />
          <script dangerouslySetInnerHTML={{__html:`
            (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:590230,hjsv:5};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'//static.hotjar.com/c/hotjar-','.js?sv=');
            `}}/>
        </Head>
        {/* <DefaultSeo {...seo} /> */}
          <noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-NJQC9N"
    height="0" width="0" style={{"display":"none","visibility":"hidden"}}></iframe></noscript>
        <script dangerouslySetInnerHTML={{__html: `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-NJQC9N');
          `}}/>
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
