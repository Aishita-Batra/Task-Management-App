import {
  ConfigureAPI,
  currentAuthenticatedUser,
  currentSession,
} from "./config.jsx";
import { get, post,put,del } from "aws-amplify/api";
import { API_NAME } from "../constants.ts";
/* fetch the members----------- */

const getTasks = async (projectId) => {
  ConfigureAPI();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = get({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks`,
      options: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    // other logic here
    const { body } = await restOperation.response;
    const response = await body.json();
    console.log("GET call succeeded", response);
    return response;
  } catch (error) {
    // window.location.href="/error";
    console.error("Error fetching task data", error);
    return null;
  }
};

const addTask = async (newTask, projectId) => {
  ConfigureAPI();
  const { username, userId, signInDetails } = await currentAuthenticatedUser();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = post({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks`,
      options: {
        body: {
          task_name: newTask.Task_Name,
          task_due_date: newTask.Task_Due_Date,
          task_creator_email: signInDetails.loginId,
          task_assignee_email: newTask.Task_Assignee_Email,
          task_status: newTask.Task_Status,
          task_priority: newTask.Task_Priority
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    // other logic here
    const { body } = await restOperation.response;
    const response = await body.json();
    console.log("post call to add task succeeded", response);
    return response[0].Task_id;
  } catch (error) {
    // window.location.href="/error";
    console.error("Error in add task api execution", error);
    return error.response.statusCode;
  }
};



// async function getTask(project_id, task_id) {
//   try {
//     const restOperation = get({
//       apiName: API_NAME,
//       path: `/projects/${project_id}/tasks/${task_id}`,
//       options: {
//         pathParameters: {
//           project_id: project_id,
//           task_id: task_id
//         },
//         headers: {
//           Authorization: `Bearer ${authToken}`
//         }
//       }
//     });
//     const { body } = await restOperation.response;
//     const response = await body.json();
//     console.log('GET call for single task succeeded: ', response);
//     return response.data; // Return the tasks data
//   } catch (e) {
//     console.log('GET call for single task failed: ', JSON.parse(e.response.body));
//     throw e; // Rethrow the error
//   }
// }


async function updateTask(updates,projectId, taskId,task_name,task_creator_email) {
  ConfigureAPI();
  const { username, userId, signInDetails } = await currentAuthenticatedUser();
  const { authToken, uname } = await currentSession();
  try {
    console.log(updates);
    console.log(taskId);
    const restOperation = put({
      apiName: API_NAME,
      path: `/projects/${projectId}/tasks/${taskId}`,
        options: {
          body:{
            Updates:updates,
            Task_Name:task_name,
            Task_Creator_Email:task_creator_email
          },
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
    });
    // const { body } = await restOperation.response;
    const response = await restOperation.response;
    console.log('PUT call for updating task succeeded: ', response);
  } catch (e) {
    // window.location.href="/error";
    console.log('PUT call for updating task failed: ', e);
  }
}

async function deleteTask(project_id, task_id) {
  ConfigureAPI();
  const { username, userId, signInDetails } = await currentAuthenticatedUser();
  const { authToken, uname } = await currentSession();
  try {
    const restOperation = del({
      apiName: API_NAME,
      path: `/projects/${project_id}/tasks/${task_id}`,
      options: {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      },
    });
    const response = await restOperation.response;
    console.log('DELETE call succeeded',response);
  } catch (e) {
    // window.location.href="/error";
    console.log('DELETE call failed: ', e);
  }
}




export { getTasks, addTask,updateTask,deleteTask };