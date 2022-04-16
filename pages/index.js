import Head from "next/head";
import { useContext } from "react";
import NftSection from "../components/features/NftSection/NftSection";
import AppLayout from "../components/layout/AppLayout";
import { NftContext } from "../context/NftContext";

export default function Home() {
  const { isLoadingData } = useContext(NftContext);
  return (
    <>
      {isLoadingData ? (
        <div className="flex items-center justify-center h-screen w-screen">
          <img src="/media/logo" className="loader_img" />
        </div>
      ) : (
        <>
          <Head>
            <title>Feathers Of Fortune</title>
            <link rel="icon" href="/favicon.ico" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="true"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
              rel="stylesheet"
            />
          </Head>
          <AppLayout>
            <NftSection />
          </AppLayout>
        </>
      )}
    </>
  );
}
