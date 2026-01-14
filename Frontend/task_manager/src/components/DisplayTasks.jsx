import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Table, Form, Button, Container, Alert } from "react-bootstrap";
import "../css/App.css";
import { addTask, getTasks,deleteTask } from "../controllers/taskops";
import EditTaskRow from "./EditTaskRow";
import { fetchMembers } from "../controllers/memberops";
import { currentAuthenticatedUser } from "../controllers/config";
import fileicon from "../../assets/file-icon.png"
import DeleteTaskModal from "./DeleteTaskModal";

const DisplayTasks = () => {
  const [tasks, setTasks] = useState("");
  const params = useParams(); //to get project_id
  const [showAlert, setShowAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [members, setMembers] = useState([]);
  const [newTask, setNewTask] = useState({
    Task_ID: "",
    Task_Name: "",
    Task_Creator_Email:"",
    Task_Assignee_Email: "",
    Task_Due_Date: "",
    Task_Priority: "",
    Task_Status: "To do",
  });
  const [editingTask, setEditingTask] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleAddNewTask = () => {
    console.log("click");
    setShowAddRow(true);
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    const { Task_Name, Task_Assignee_Email, Task_Due_Date, Task_Priority } =
      newTask;
    if (
      Task_Name === "" ||
      Task_Assignee_Email === "" ||
      Task_Due_Date === "" ||
      Task_Priority === ""
    ) {
      setShowAlert(true);
    } else {
      // Call the createTask function with the form data
      const { username, userId, signInDetails } = await currentAuthenticatedUser();
      const task_id = await addTask(newTask, params.project_id);
      const addedTask={ ...newTask, Task_ID: task_id, Task_Creator_Email:signInDetails.loginId};
      setNewTask(addedTask);
      setTasks([...tasks, addedTask]);
      console.log(tasks);
      // Reset the form data
      setNewTask({
        Task_ID: "",
        Task_Name: "",
        Task_Creator_Email:"",
        Task_Assignee_Email: "",
        Task_Due_Date: "",
        Task_Priority: "",
        Task_Status: "To do",
      });
      setShowAddRow(false);
    }
  };

  const fetchTasks = async (project_id) => {
    try {
      const response = await getTasks(project_id);
      console.log(response);
      setTasks(response);
      console.log("GET call for tasks succeeded: ", response);
      // console.log('Response data type:', typeof response);
    } catch (e) {
      console.log("GET call for tasks failed: ", e);
    }
  };

  const getMembers = async (project_id) => {
    try {
      const response = await fetchMembers(project_id);
      setMembers(response);
      console.log("GET call for members succeeded: ", response);
    } catch (e) {
      console.log("GET call for members failed: ", e);
    }
  };
  const cancelAddTask = () => {
    setShowAddRow(false);
    setNewTask({
      Task_ID: "",
      Task_Name: "",
      Task_Creator_Email:"",
      Task_Assignee_Email: "",
      Task_Due_Date: "",
      Task_Priority: "",
      Task_Status: "To do",
    });
  };

  const handleEditTask = (task_id) => {
    console.log("Edit task with ID:", task_id);
    setEditingTask(task_id);
  };
  
  const delTaskClick = () => {
    setShowDeleteModal(true);
  };
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

 const navigateToFile=(task_id,task_name)=>{
  navigate(`/projects/${params.project_id}/tasks/${task_id}/file`, {
    state: { Task_Name: task_name },
  });
 }

  useEffect(() => {
    fetchTasks(params.project_id);
    getMembers(params.project_id);
  }, [params.project_id]);

  return (
    <>
      {showAlert && (
        <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
          Please fill all the fields
        </Alert>
      )}
      {showDeleteAlert && (
        <Alert variant="danger" onClose={() => setShowDeleteAlert(false)} dismissible>
          Only Task Creator can delete the task
        </Alert>
      )}
      <Card className="card-component-bottom">
        <Card.Body className="task-component">
          <Table striped bordered hover responsive className="w-100">
            <thead>
              <tr className="header-row">
                <th>Task Name</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {Array.isArray(tasks) &&
                tasks.length > 0 &&
                tasks.map((task) => (
                  <tr key={task.Task_ID} className="table-row">
                    {editingTask!="" & editingTask === task.Task_ID ? (
                      <>
                        <EditTaskRow task={task} tasks={tasks} setTasks={setTasks} members={members} setShowAlert={setShowAlert} setEditingTask={setEditingTask}/>
                      </>
                    ) : (
                      <>
                        <td>{task.Task_Name}</td>
                        <td>{task.Task_Assignee_Email}</td>
                        <td>{task.Task_Due_Date}</td>
                        <td>{task.Task_Priority}</td>
                        <td>{task.Task_Status}</td>
                        <td className="task-crud">
                          <Button
                            variant="primary"
                            onClick={()=>{handleEditTask(task.Task_ID)}}
                          > 
                            Edit
                          </Button>
                          <Button 
                          onClick={()=>{delTaskClick()}}
                          >Delete</Button>
                          <DeleteTaskModal
                            show={showDeleteModal}
                            handleClose={handleDeleteModalClose}
                            task_id={task.Task_ID}
                            task_creator_email={task.Task_Creator_Email}
                            tasks={tasks}
                            setTasks={setTasks}
                            setShowDeleteAlert={setShowDeleteAlert}
                          /> 
                          <Button className="file-btn" onClick={()=>{navigateToFile(task.Task_ID,task.Task_Name)}}>
                            <img className="file-icon" src={fileicon}></img></Button>
                        </td>
                      </>
                    )} 
                  </tr>
                ))}
              {showAddRow && (
                <>
                  <tr>
                    <td>
                      <Form.Control
                        className="table-div"
                        name="Task_Name"
                        value={newTask.Task_Name}
                        onChange={handleInputChange}
                        placeholder="Task Name"
                        autoComplete="Off"
                      />
                    </td>
                    <td>
                      <Form.Select
                        className="table-div" name="Task_Assignee_Email"
                        tyep="email" value={newTask.Task_Assignee_Email}
                        onChange={handleInputChange}
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
                        value={newTask.Task_Due_Date}
                        onChange={handleInputChange}
                        placeholder="Due Date"
                      />
                    </td>
                    <td>
                      <Form.Select
                        className="table-div"
                        name="Task_Priority"
                        value={newTask.Task_Priority}
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
                        value={newTask.Task_Status}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Status</option>
                        <option value="Complete">Complete</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="To do">To do</option>
                      </Form.Select>
                    </td>
                    <td className="task-crud">
                      <Button type="submit" onClick={handleAddTask}>
                        Add
                      </Button>
                      <Button onClick={cancelAddTask}>Cancel</Button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <br />
      <Button onClick={handleAddNewTask}>Create Task</Button>
    </>
  );
};
export default DisplayTasks;
