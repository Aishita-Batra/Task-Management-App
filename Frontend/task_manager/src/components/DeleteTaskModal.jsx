import { Button, Modal } from "react-bootstrap";
import { deleteTask } from "../controllers/taskops";
import { useParams } from "react-router-dom";
import { currentAuthenticatedUser } from "../controllers/config";

export default function DeleteTaskModal({ show, handleClose,task_id,task_creator_email,tasks,setTasks,setShowDeleteAlert}) {

  const { project_id}=useParams();

  const handleDelete=async()=>{
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
      if(task_creator_email!==signInDetails.loginId){
        handleClose();
        setShowDeleteAlert(true);
        return;
      }
      await deleteTask(project_id,task_id);
      setTasks(tasks.filter((task) => task.Task_ID !== task_id));
  }  
  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this task?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            No
          </Button>
          <Button variant="primary" onClick={handleDelete}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
