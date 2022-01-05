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
const MyApp = ({ Component, pageProps:others }) => {
  let { seo = {}, ...pageProps } = others;

  // console.log(pageProps);
  return (
    <ZetaProvider>
      <>
        <Head>
          <meta charset="UTF-8"/>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="robots" content="index, follow"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta property="og:image" content={"https://res.cloudinary.com/tuteria/image/upload/c_fit,h_627,q_80,w_1200/v1/landing_page_images/successful-teacher-2021-09-24-03-01-11-utc.jpg"} />
          <meta name="keywords" content="Keywords" />
          <title>{seo.title || `Tuteria Tutor Application`}</title>
          <meta
            property="og:title"
            content={seo.title || "Tuteria Tutor Application"}
          />
          <meta
            property="og:description"
            content={seo.description || ""}
          />
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
      {pageProps.displayCrisp?null:
        <script type="text/javascript" dangerouslySetInnerHTML={{__html:`window.$crisp=[];window.CRISP_WEBSITE_ID="6d3491e9-3cbf-4b1d-9c31-5e4eb5c87af2";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}}/>
      }
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
