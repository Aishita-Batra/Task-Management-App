import {
    ConfigureAPI,
    currentAuthenticatedUser,
    currentSession,
  } from "./config.jsx";
import { get, post,del,put } from "aws-amplify/api";
import { API_NAME } from "../constants.ts";

async function addproject(Name, Desc)
{
  ConfigureAPI();
    const { authToken, uname } = await currentSession();
    try {
        const restOperation = post({
          apiName: API_NAME,
          path: "/projects",
          options: {
            body: {
              Project_Name:Name,
              Project_Desc:Desc,
              Project_Owner_Name:uname
            },
            headers: {
              Authorization: `Bearer ${authToken}`
            },
          },
        });
        const { body } = await restOperation.response;
        const response = await body.json();
        // console.log(response);
        console.log("POST call succeeded, Project added", response);
        return response;
      } catch (e) {
        // window.location.href="/error";
        console.log("POST call failed: ", e);
      }
}

async function getallprojects()
{
  ConfigureAPI();
    const { authToken, uname } = await currentSession();
    try {
        const restOperation = get({
          apiName: API_NAME,
          path: "/projects",
          options: {
            headers: {
              Authorization: `Bearer ${authToken}`
            },
          },
        });
        const { body } = await restOperation.response;
        const response = await body.json();
        console.log("GET call succeeded", response);
        return response;
      } catch (e) {
        // window.location.href="/error";
        console.log("GET call failed: ", e);
      }

}
async function getproject(project_id)
{
  ConfigureAPI();
    const { authToken, uname } = await currentSession();
    try {
        const restOperation = get({
          apiName: API_NAME,
          path: `/projects/${project_id}`,
          options: {
            headers: {
              Authorization: `Bearer ${authToken}`
            },
          },
        });
        const { body,statusCode } = await restOperation.response;
        if(statusCode==404){
          return null;
        }
        const response = await body.json();
        return response;
        console.log("GET call succeeded", response);
      } catch (e) {
        window.location.href="/error";
        console.log("GET call failed: ", e);
      }

}
async function deleteproject(project_id){
  try {
    const { authToken, uname } = await currentSession();
    const restOperation = del({
      apiName: API_NAME,
      path: `/projects/${project_id}`,
      options: {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
      },
    });
    const { body } = await restOperation.response;
    const response = await body.json();
    return response;
    console.log('DELETE call succeeded',res);
  } catch (e) {
    window.location.href="/error";
    console.log('DELETE call failed: ', e);
  }  
}
async function updateproject(project_id,updatedDesc){
  try {
    const { authToken, uname } = await currentSession();
    const updates = {Project_Description: `${updatedDesc}`};
    const restOperation = put({
      apiName: API_NAME,
      path: `/projects/${project_id}`,
      options: {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body:{
          Updates:updates
        }
      }
    });
    const response = await restOperation.response;
    console.log('PUT call succeeded: ', response);
  } catch (e) {
    window.location.href="/error";
    console.log('PUT call failed: ', e);
  }
}
export {
    addproject,getallprojects,getproject,deleteproject,updateproject
}
