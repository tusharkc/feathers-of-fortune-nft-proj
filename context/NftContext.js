import axios from "axios";
import { useState, createContext, useEffect } from "react";
import {
  ATOMIC_ASSETS_END_POINT,
  IPFS_URL,
  RPC_ENDPOINT,
  WAX_PINK_END_POINT,
} from "../components/constants/constants";
import { useRouter } from "next/router";
import * as waxjs from "@waxio/waxjs/dist";

export const NftContext = createContext();

export const NftContextProvider = ({ children }) => {
  const { pathname } = useRouter();
  const [userAccount, setUserAccount] = useState();
  const [campaignData, setCampaignData] = useState(null);
  const [nftCardData, setNftCardData] = useState();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showPagination, setShowPagination] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(8);
  const [authUserData, setAuthUserData] = useState();
  const [isAuthorizedUser, setIsAuthorizedUser] = useState(false);
  const [isTransactionSussessful, setIsTransactionSussessful] = useState();
  const [transactionId, setTransactionId] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  let pageSize = 8;

  useEffect(() => {
    waxUserLogIn();
  }, []);

  useEffect(() => {
    checkIfAuthorizeduser();
  }, [authUserData]);

  useEffect(() => {
    switchApiCallAccordingToActiveUserRoute();
  }, [pathname]);

  useEffect(() => {
    pushNftCardDataToArray(startIndex, endIndex);
    campaignData?.length <= pageSize
      ? setShowPagination(false)
      : setShowPagination(true);
  }, [campaignData, startIndex, endIndex]);

  const wax = new waxjs.WaxJS({
    rpcEndpoint: RPC_ENDPOINT,
    tryAutoLogin: true,
  });

  const waxUserLogIn = async () => {
    try {
      let isAutoLoginAvailable = await wax.isAutoLoginAvailable();
      if (isAutoLoginAvailable == true) {
        let userAccountIfAlreadyLoggedIn = wax.userAccount;
        setUserAccount(userAccountIfAlreadyLoggedIn);
        getAuthUsers();
      } else {
        const userAccountFromLogin = await wax.login();
        setUserAccount(userAccountFromLogin);
        getAuthUsers();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const switchApiCallAccordingToActiveUserRoute = async () => {
    setIsLoadingData(true);
    const runningCampaignsData = [];

    switch (pathname) {
      case "/":
        await axios
          .post(`${WAX_PINK_END_POINT}/v1/chain/get_table_rows`, {
            json: true,
            code: "fortunebirds",
            scope: "fortunebirds",
            table: "campaigns",
            limit: 150,
          })
          .then((response) => {
            for (let i = 0; i < response.data.rows?.length; i++) {
              const runningCampaigns = response.data?.rows[i];

              if (runningCampaigns?.asset_ids?.length > 0) {
                runningCampaignsData.push(runningCampaigns);
                setCampaignData(runningCampaignsData);
              }
            }
          })
          .catch((error) => {
            console.log(error);
          });
        setIsLoadingData(false);
        break;

      case "/ended":
        await axios
          .post(`${WAX_PINK_END_POINT}/v1/chain/get_table_rows`, {
            json: true,
            code: "fortunebirds",
            scope: "fortunebirds",
            table: "results",
            limit: 1000,
          })
          .then((response) => {
            setCampaignData(response.data.rows);
          })
          .catch((error) => {
            console.log(error);
          });
        setIsLoadingData(false);
      default:
        break;
    }
  };

  const pushNftCardDataToArray = async (
    startIndex = startIndex,
    endIndex = endIndex
  ) => {
    const nftCardDataFromApi = [];
    setIsLoadingData(true);
    if (campaignData) {
      if (pathname == "/") {
        for (let i = startIndex; i < endIndex; i++) {
          await axios
            .get(
              `${ATOMIC_ASSETS_END_POINT}/atomicassets/v1/assets/${campaignData[i]?.asset_ids[0]}`
            )
            .then((response) => {
              nftCardDataFromApi.push({
                contractAccount: campaignData[i]?.contract_account,
                nftImgUrl: `${IPFS_URL}/${response?.data?.data?.data?.img}`,
                campaignId: campaignData[i]?.id,
                creator: campaignData[i]?.authorized_account,
                entryCost: campaignData[i]?.entrycost,
                totalEntriesStart: campaignData[i]?.accounts.length,
                totalEntriesEnd: campaignData[i]?.max_users,
                loopTimeSeconds: campaignData[i]?.loop_time_seconds,
                lastRoll: campaignData[i]?.last_roll,
              });
            })
            .catch((error) => {
              console.error(error);
            });
        }
        setIsLoadingData(false);
        setNftCardData(nftCardDataFromApi);
      } else if (pathname == "/ended") {
        for (let i = startIndex; i < endIndex; i++) {
          await axios
            .get(
              `${ATOMIC_ASSETS_END_POINT}/atomicassets/v1/assets/${campaignData[i]?.asset_id}`
            )
            .then((response) => {
              nftCardDataFromApi.push({
                nftImgUrl: `${IPFS_URL}/${response?.data?.data?.data?.img}`,
                campaignId: campaignData[i]?.campaign_id,
                winner: campaignData[i]?.winner,
              });
            })
            .catch((error) => {
              console.error(error);
            });
        }
        setNftCardData(nftCardDataFromApi);
        setIsLoadingData(false);
      }
    }
  };

  const getAuthUsers = async () => {
    await axios
      .post(`${WAX_PINK_END_POINT}/v1/chain/get_table_rows`, {
        json: true,
        code: "fortunebirds",
        scope: "fortunebirds",
        table: "authusers",
        limit: 200,
      })
      .then((response) => {
        setAuthUserData(response.data.rows);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const checkIfAuthorizeduser = () => {
    authUserData?.forEach((user) => {
      if (user.account == userAccount) {
        setIsAuthorizedUser(true);
      }
    });
  };

  const createCampaign = async (dataToSend) => {
    try {
      const result = await wax.api.transact(
        {
          actions: [
            {
              account: "fortunebirds",
              name: "create",
              authorization: [
                {
                  actor: wax.userAccount,
                  permission: "active",
                },
              ],

              data: dataToSend,
            },
          ],
        },
        { blocksBehind: 3, expireSeconds: 30 }
      );
      setTransactionId(result.transaction_id);
      setIsTransactionSussessful(true);
    } catch (e) {
      const errorMessageFromCatch = await e.message;
      setErroMsg(errorMessageFromCatch);
      setIsTransactionSussessful(false);
    }
  };

  const joinCampaign = async (contractAccount, campaignId, entryCost) => {
    try {
      const result = await wax?.api?.transact(
        {
          actions: [
            {
              account: contractAccount,
              name: "transfer",
              authorization: [{ actor: wax.userAccount, permission: "active" }],
              data: {
                from: wax.userAccount,
                to: "fortunebirds",
                quantity: entryCost,
                memo: campaignId,
              },
            },
          ],
        },
        { blocksBehind: 4, expireSeconds: 120 }
      );
      setIsTransactionSussessful(true);
      setTransactionId(result.transaction_id);
    } catch (error) {
      const erroMsgFromCatch = await error?.message;
      setErroMsg(erroMsgFromCatch);
      setIsTransactionSussessful(false);
    }
  };

  return (
    <NftContext.Provider
      value={{
        nftCardData,
        isLoadingData,
        showPagination,
        startIndex,
        setStartIndex,
        endIndex,
        setEndIndex,
        campaignData,
        waxUserLogIn,
        userAccount,
        setUserAccount,
        isAuthorizedUser,
        createCampaign,
        isTransactionSussessful,
        transactionId,
        erroMsg,
        setIsAuthorizedUser,
        joinCampaign,
        setNftCardData,
        currentPageIndex,
        setCurrentPageIndex,
      }}
    >
      {children}
    </NftContext.Provider>
  );
};
