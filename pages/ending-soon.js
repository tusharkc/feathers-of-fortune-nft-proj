import axios from "axios";
import React from "react";
import { useContext } from "react";
import {
  ATOMIC_ASSETS_END_POINT,
  IPFS_URL,
  WAX_PINK_END_POINT,
} from "../components/constants/constants";
import NftFilter from "../components/features/NftFilters/NftFilter";
import NftCard from "../components/features/NftSection/components/NftCard";
import AppLayout from "../components/layout/AppLayout";
import { StartFirebase } from "../context/firebase-config";
import { NftContext } from "../context/NftContext";
import { onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";

const EndingSoon = (props) => {
  const firebaseDb = StartFirebase();
  const { isLoadingData } = useContext(NftContext);

  const [nftCardData, setNftCardData] = useState([]);
  const [nftCardDataWithoutDuplicates, setNftCardDataWithoutDuplicates] =
    useState([]);

  useEffect(() => {
    onValue(ref(firebaseDb), (snapshot) => {
      if (snapshot.exists()) {
        snapshot.child("campaigns").forEach((singularCampaign) => {
          (async () => {
            const singularCampaignObj = singularCampaign
              .child("runningCampaigns")
              .val();

            const response = await axios.get(
              `${ATOMIC_ASSETS_END_POINT}/atomicassets/v1/assets/${singularCampaignObj?.asset_ids[0]}`
            );

            setNftCardData((prevState) => [
              ...prevState,
              {
                joinedAccounts: singularCampaignObj?.accounts || [],
                assetId: response.data?.data?.asset_id,
                contractAccount: singularCampaignObj?.contract_account,
                nftImgUrl: `${IPFS_URL}/${response?.data?.data?.data?.img}`,
                videoNftUrl: `${IPFS_URL}/${response?.data?.data?.template?.immutable_data?.video}`,
                isVideo:
                  `${IPFS_URL}/${response?.data?.data?.data?.img}` == true
                    ? false
                    : `${IPFS_URL}/${response?.data?.data?.data?.video}` !=
                      `${IPFS_URL}/undefined`
                    ? true
                    : false,
                campaignId: singularCampaignObj?.id,
                creator: singularCampaignObj?.authorized_account,
                entryCost: singularCampaignObj?.entrycost,
                totalEntriesStart: singularCampaignObj?.accounts?.length || 0,
                totalEntriesEnd: singularCampaignObj?.max_users,
                loopTimeSeconds: singularCampaignObj?.loop_time_seconds,
                lastRoll: singularCampaignObj?.last_roll,
                totalEntriesEnd: singularCampaignObj?.max_users,
              },
            ]);
          })();
        });
      }
    });
  }, []);

  useEffect(() => {
    setNftCardDataWithoutDuplicates(
      nftCardData.filter((v, i) => {
        return (
          nftCardData.map((val) => val.campaignId).indexOf(v.campaignId) == i
        );
      })
    );
  }, [nftCardData]);

  return (
    <>
      {isLoadingData ? (
        <div className="flex items-center justify-center h-screen w-screen">
          <img src="/media/logo" className="loader_img" />
        </div>
      ) : (
        <>
          <AppLayout>
            <div className="container my-20 mx-auto">
              <NftFilter />
              <div className="grid grid-col-1 md:grid-cols-4 gap-8">
                {nftCardDataWithoutDuplicates.length > 0
                  ? nftCardDataWithoutDuplicates.map((item, index) => {
                      return (
                        <div key={index} className="grid-cols-4">
                          <NftCard
                            nftSrc={item.nftImgUrl}
                            campaignId={item.campaignId}
                            creator={item.creator}
                            loopTimeSeconds={item.loopTimeSeconds}
                            totalEntriesStart={item.totalEntriesStart}
                            totalEntriesEnd={item.totalEntriesEnd}
                            entryCost={item.entryCost}
                            contractAccount={item.contractAccount}
                            lastRoll={item.lastRoll}
                            isVideo={item.isVideo}
                            videoNftUrl={item.videoNftUrl}
                            assetId={item.assetId}
                            joinedAccounts={item.joinedAccounts}
                          />
                        </div>
                      );
                    })
                  : ""}
              </div>
            </div>
          </AppLayout>
        </>
      )}
    </>
  );
};

export default EndingSoon;

export async function getServerSideProps(context) {
  const firebaseDb = StartFirebase();

  const responseFromPost = await axios.post(
    `${WAX_PINK_END_POINT}/v1/chain/get_table_rows`,
    {
      json: true,
      code: "fortunebirds",
      scope: "fortunebirds",
      table: "campaigns",
      limit: 150,
    }
  );

  onValue(ref(firebaseDb), (snapshot) => {
    for (let i = 0; i < responseFromPost?.data?.rows?.length; i++) {
      const runningCampaigns = responseFromPost.data?.rows[i];

      if (
        runningCampaigns?.asset_ids?.length > 0 &&
        snapshot.child("campaigns").hasChild(runningCampaigns?.asset_ids[0]) ==
          false
      ) {
        set(ref(firebaseDb, `/campaigns/${runningCampaigns?.asset_ids[0]}`), {
          runningCampaigns,
        });
      }
    }
  });

  return {
    props: {},
  };
}
