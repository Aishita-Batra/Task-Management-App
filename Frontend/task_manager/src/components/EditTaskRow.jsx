import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from "react";
import "../css/App.css";
import { Button,Form } from "react-bootstrap";
import { updateTask } from "../controllers/taskops";
import { currentAuthenticatedUser } from '../controllers/config';

const  EditTaskRow = (props) =>{
    const params = useParams();
    const[isCreator, SetIsCreator]=useState(false);
    const {task,tasks,setTasks,members,setShowAlert,setEditingTask}=props;

  const currentTask = {
    Task_ID: task.Task_ID,
    Task_Name: task.Task_Name,
    Task_Creator_Email:task.Task_Creator_Email,
    Task_Assignee_Email: task.Task_Assignee_Email,
    Task_Due_Date: task.Task_Due_Date,
    Task_Priority: task.Task_Priority,
    Task_Status: task.Task_Status,
  };

  const [updatedTask, setUpdatedTask] = useState(currentTask);
  
  const checkTaskCreator=async()=>{
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
    if(currentTask.Task_Creator_Email===signInDetails.loginId){
      SetIsCreator(true);
    }
  }
  const findUpdatedFields=(currentTask,updatedTask)=>{
    const updatedFields = {};

    for (const key in updatedTask) {
      if (updatedTask[key] !== currentTask[key]) {
        updatedFields[key] = updatedTask[key];        
      }
    }

    return updatedFields;
  }

  const handleInputChange = (e) => {
    setUpdatedTask({ ...updatedTask, [e.target.name]: e.target.value });
  };

  const handleSaveTask = async (event) => {

    event.preventDefault();
    const { Task_Name, Task_Assignee_Email, Task_Due_Date, Task_Priority } =
      updatedTask;
    if (
      Task_Name === "" ||
      Task_Assignee_Email === "" ||
      Task_Due_Date === "" ||
      Task_Priority === ""
    ) {
      setShowAlert(true);
    } else {
      console.log(updatedTask);
      const updateTaskFields = findUpdatedFields(currentTask, updatedTask);
      console.log(updateTaskFields);
      await updateTask(updateTaskFields, params.project_id,task.Task_ID,task.Task_Name,task.Task_Creator_Email);
      // Reset the form data
      setTasks(
        tasks.map((t) =>
          t.Task_ID === task.Task_ID ? { ...t, ...updatedTask } : t
        ));
      setEditingTask("");
      setUpdatedTask(currentTask);
    }
  };

  const handleCancelEdit=()=>{
    setUpdatedTask(currentTask);
    setEditingTask("");
  }

  useEffect(()=>{
    checkTaskCreator();
  },[])

  return (
    <>
      <td>
        <Form.Control
          className="table-div"
          name="Task_Name"
          value={updatedTask.Task_Name}
          onChange={handleInputChange}
          placeholder="Task Name"
          {...(isCreator ? {} : { disabled: true })}
        />
      </td>
      <td>
        <Form.Select
          className="table-div"
          name="Task_Assignee_Email"
          tyep="email"
          value={updatedTask.Task_Assignee_Email}
          onChange={handleInputChange}
          {...(isCreator ? {} : { disabled: true })}
        >
          <option value="">Select Assignee</option>
          {members === null || members.length === 0 ? (
            <option value="" disabled>
              No members found
            </option>
          ) : (
            members.map((member) => (
              <option key={member.email} value={member.email}>
                {member.email}
              </option>
            ))
          )}
        </Form.Select>
      </td>
      <td>
        <Form.Control
          className="table-div"
          name="Task_Due_Date"
          type="date"
          value={updatedTask.Task_Due_Date}
          onChange={handleInputChange}
          placeholder="Due Date"
          {...(isCreator ? {} : { disabled: true })}
        />
      </td>
      <td>
        <Form.Select
          className="table-div"
          name="Task_Priority"
          value={updatedTask.Task_Priority}
          onChange={handleInputChange}
        >
          <option value="">Select Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Form.Select>
      </td>
      <td>
        <Form.Select
          className="table-div"
          name="Task_Status"
          value={updatedTask.Task_Status}
          onChange={handleInputChange}
        >
          <option value="">Select Status</option>
          <option value="Complete">Complete</option>
          <option value="In-Progress">In-Progress</option>
          <option value="To do">To do</option>
        </Form.Select>
      </td>
      <td className="task-crud">
        <Button type="submit" onClick={handleSaveTask}>
          Save
        </Button>
        <Button onClick={handleCancelEdit}>Cancel</Button>
      </td>
    </>
  );
}
export default EditTaskRow;
