import {
    ConfigureAPI,
    currentAuthenticatedUser,
    currentSession,
  } from "./config.jsx";
  import { get, post , del, put} from "aws-amplify/api";
  import { API_NAME } from "../constants.ts";
  /* fetch the members----------- */
  
  const fetchMembers = async (projectId) => {
    ConfigureAPI();
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
    const { authToken, uname } = await currentSession();
    try {
      const restOperation = get({
        apiName: API_NAME,
        path: `/projects/${projectId}/members`,
        options:{
          headers:{
            Authorization: `Bearer ${authToken}`
          },
        },
      });
    // other logic here
      const { body } = await restOperation.response;
      console.log(body);
      const response = await body.json();
      console.log("GET call succeeded", response);
      return response;
    } catch (error) {
      // window.location.href="/error";
      console.error("Error fetching project data", error);
      return null;
    }
  };
  
  const addTeamMember = async (projectId, newMember) => {
    ConfigureAPI();
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
    const { authToken, uname } = await currentSession();
    try {
      const restOperation = post({
        apiName: API_NAME,
        path: `/projects/${projectId}/members`,
        options: {
          body: {
            email_id: newMember.email,
            full_name: newMember.name,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      });
      const response = await restOperation.response;
      console.log("post call to add team member succeeded", response);
      console.log(response.statusCode);
      return response;
    } catch (error) {
      // window.location.href="/error";
      console.error("Error in add member api execution", error);
      return error.response;
    }
  };
  
  /* remove the team member from the project----*/
  const removeTeamMember = async (projectId, email) => {
    ConfigureAPI();
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
    const { authToken, uname } = await currentSession();
    try {
      const restOperation = put({
        apiName: API_NAME,
        path: `/projects/${projectId}/members`,
        options: {
          body: {
            email_id: email,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      });
      const response = await restOperation.response;
      console.log("delete call to remove team member succeeded", response);
      console.log(response);
      return response;
    } catch (error) {
      // window.location.href="/error";
      console.error("Error in delete member api execution", error.response.body);
      return error.response.body;
    }
  };
  
  export { removeTeamMember, fetchMembers, addTeamMember };
  
  