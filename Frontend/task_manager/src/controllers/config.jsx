import { Amplify } from "aws-amplify";
import config from "../../src/amplifyconfiguration.json";
import { getCurrentUser, fetchAuthSession, deleteUser } from "aws-amplify/auth";
import { sessionStorage } from "aws-amplify/utils";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";

function ConfigureCognito() {
  //amplifyconfiguration.json file contains cognito authentication details,
  //Amplify.configure is a method provided by AWS amplify library that sets up and configures AWS service specified in the config object
  Amplify.configure(config);
}

//get details of current user after authentication
async function currentAuthenticatedUser() {
  try {
    const { username, userId, signInDetails } = await getCurrentUser();
    return { username, userId, signInDetails };
  } catch (err) {
    console.log(err);
  }
}

//get session tokens of current user
async function currentSession() {
  try {
    //fetchAuthsession fetch value from session storage
    const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};
    // console.log(`The idToken: ${idToken}`);
    const authToken = idToken?.toString(); //convert id token to string to add in api call
    const uname = idToken?.payload?.name; //authenticated user name
    return { authToken, uname };
  } catch (err) {
    console.log(err);
  }
}

//stores tokens and user data in session storage
async function setSessionStorage() {
  cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
}

//configure api
async function ConfigureAPI()
{  
const {authToken,uname} = await currentSession();
const existingConfig = Amplify.getConfig();

const apiconfig = {
  ...existingConfig,
  API: {
    ...existingConfig.API,
    REST: {
      ...existingConfig.API?.REST,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      project_task_app: {
        endpoint:
          "https://pnssj2579g.execute-api.us-east-1.amazonaws.com/dev",
        region: "us-east-1",
        // Optional
      },
    },
  },
};

Amplify.configure(apiconfig);

}
export {
  ConfigureCognito,
  currentAuthenticatedUser,
  currentSession,
  setSessionStorage,
  ConfigureAPI
};
