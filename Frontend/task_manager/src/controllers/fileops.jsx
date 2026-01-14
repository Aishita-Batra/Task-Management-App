import {
  ConfigureAPI,
  currentAuthenticatedUser,
  currentSession,
} from "./config.jsx";
import { get, post, del, put } from "aws-amplify/api";
import { API_NAME } from "../constants.ts";


const fetchPreSignedURL = async (projectId,taskId,name,type) => {
  ConfigureAPI();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = post({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks/${taskId}/file/geturl`,
      options: {
        body: {
          fileName: name,
          fileType: type
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    
    const { body,statusCode }= await restOperation.response;
    const response = await body.json();
    const presignedUrl=response.presignedUrl;
    return {presignedUrl,statusCode};
  } catch (error) {
    // console.error("Error fetching pre signed URL", error);
    console.log(error.response);
    console.log(error.response.statusCode);
    if(error.response.statusCode==409)
    {
      return { presignedUrl: null, statusCode: error.statusCode };
    }
  }
};

const addFile=async(projectId,taskId,name)=>{
  ConfigureAPI();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = post({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks/${taskId}/file`,
      options: {
        body: {
          fileName: name,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    
    const { body }= await restOperation.response;
    console.log(body);
    const response = await body.json();
    const url=response.presignedUrl;
    return url;
  } catch (error) {
    // window.location.href="/error";
    console.error("Error", error);
    return null;
  }
}

const getallfiles=async(projectId,taskId)=>{
  ConfigureAPI();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = get({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks/${taskId}/file`,
      options: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    
    const { body }= await restOperation.response;
    const response = await body.json();
    return response;
  } catch (error) {
    // window.location.href="/error";
    console.error("Error", error);
    return null;
  }
}

const getFile=async(projectId, taskId,fileName)=>{
  ConfigureAPI();
  console.log(fileName);
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = get({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks/${taskId}/file/geturl?file_name=${fileName}`,
      options: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    const { body }= await restOperation.response;
    const response = await body.json();
    return response;
  } catch (error) {
    // window.location.href="/error";
    console.error("Error", error);
    return null;
  }
}

const deleteFile=async(project_id, task_id, fileName)=>{
  console.log(fileName);
  ConfigureAPI();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = del({
      apiName: API_NAME,
      path: `/projects/${project_id}/tasks/${task_id}/file?file_name=${fileName}`,
      options: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    const { body }= await restOperation.response;
    const response = await body.json();
    return response;
  } catch (error) {
    // window.location.href="/error";
    console.log("Error",error);
    return null;
  }
}

export { fetchPreSignedURL,addFile,getallfiles,getFile,deleteFile};