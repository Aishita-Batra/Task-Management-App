import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row ,ToastContainer,Toast} from "react-bootstrap";
import FileModal from "./FileModal";
import DeleteFileModal from "./DeleteFileModal";
import { useLocation, useParams } from "react-router-dom";
import attachIcon from "../../assets/attach.png";
import { getallfiles, getFile } from "../controllers/fileops";

function File() {
  const [displayModal, setDisplayModal] = useState(false);
  const { project_id, task_id } = useParams();
  const location = useLocation();
  const task_name = location.state?.Task_Name;
  const [files, setFiles] = useState([]);
  const [displayDeleteModal,setDisplayDeleteModal]=useState(false);
  const [showFileExistsToast, setShowFileExistsToast] = useState(false);

  const handleModalClose = () => {
    setDisplayModal(false);
  };

  const handleClick = () => {
    setDisplayModal(true);
  };

  const getfiles = async () => {
    const res = await getallfiles(project_id, task_id);
    setFiles(res);
    console.log(res);
  };
  async function getfilehandler(name) {
    console.log(name);
    const res = await getFile(project_id, task_id, name);
    console.log(res);
    window.open(res["Url"], "_blank");
  }

  const delFileClick = () => {
    setDisplayDeleteModal(true);
  };
  const handleDeleteModalClose = () => {
    setDisplayDeleteModal(false);
  };

  useEffect(() => {
    getfiles();
  }, []);

  return (
    <>
      {showFileExistsToast && (
        <ToastContainer style={{ zIndex: 1 }} position="top-center">
          <Toast
            className="d-inline-block m-1"
            bg="info"
            onClose={() => setShowFileExistsToast(false)}
          >
            <Toast.Header>
              <strong className="me-auto">Update</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              Since File with this name already exists, Existing File is replaced
            </Toast.Body>
          </Toast>
        </ToastContainer>
      )}

      <FileModal
        show={displayModal}
        handleClose={handleModalClose}
        files={files}
        setFiles={setFiles}
        setShowFileExistsToast={setShowFileExistsToast}
      />

      <Container fluid className="my-3  team-container">
        <Row className="mx-1 mb-2">
          <Col>
            <h4>{task_name} - Files</h4>
          </Col>
        </Row>
      </Container>
      <Card className="file-component-bottom">
        <Card.Body className="file-list">
          {Array.isArray(files) &&
            files.length > 0 &&
            files.map((file) => (
              <Row className="file-list-row" key={file.File_Name}>
                <Col>
                  <Card.Title>{file.File_Name}</Card.Title>
                </Col>
                <Col md="auto" className="file-btn-component">
                  <Button onClick={()=>getfilehandler(file.File_Name)}>
                    View File
                  </Button>
                  <Button onClick={()=>delFileClick()}>Delete File</Button>
                  <DeleteFileModal
                    show={displayDeleteModal}
                    handleClose={handleDeleteModalClose}
                    fileToBeDeleted={file.File_Name}
                    files={files}
                    setFiles={setFiles}
                    text="Are you sure you want to delete this file?"
                  /> 
                </Col>
              </Row>
            ))}
        </Card.Body>
      </Card>
      <Button onClick={handleClick} className="upload-file-btn">
        <img className="attach-icon" src={attachIcon}></img>
        <div>Upload File</div>
      </Button>
    </>
  );
}

export default File;
