import { Button, Modal } from "react-bootstrap";
import { deleteFile } from "../controllers/fileops";
import { useParams } from "react-router-dom";

export default function DeleteFileModal({ show, handleClose,fileToBeDeleted,files,setFiles}) {

  const { project_id,task_id }=useParams();

  const handleDelete=async()=>{
    const name=fileToBeDeleted
    const res = await deleteFile(project_id, task_id, name);
    console.log(res);
    await setFiles(files.filter((file) => file.File_Name !== name));
    handleClose();
  }  
  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this file?
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
