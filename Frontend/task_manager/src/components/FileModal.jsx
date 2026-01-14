import React, { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { fetchPreSignedURL,addFile } from "../controllers/fileops";
import { useParams } from "react-router-dom";

export default function FileModal({ show, handleClose,files,setFiles,setShowFileExistsToast}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { project_id,task_id }=useParams();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Function to upload the selected file using the generated presigned url
  const uploadToPresignedUrl = async (presignedUrl) => {
    // Upload file to pre-signed URL
    const uploadResponse = await axios.put(presignedUrl, selectedFile, {
      headers: {
        "Content-Type": selectedFile.type,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
        console.log(`Upload Progress: ${percentCompleted}%`);
      },
    });
    console.log(uploadResponse);
  };

  // Function to orchestrate the upload process
  const handleUpload = async () => {
    try {
      // Ensure a file is selected
      if (!selectedFile) {
        console.error("No file selected.");
        return;
      }
      console.log(selectedFile.name);
      const {presignedUrl,statusCode} = await fetchPreSignedURL(project_id,task_id,selectedFile.name,selectedFile.type);
      if(statusCode!=200){
        console.log("Error adding file");
        handleClose();
        setShowFileExistsToast(true);
        return;
      }
      await uploadToPresignedUrl(presignedUrl);

      await addFile(project_id,task_id,selectedFile.name); //add file to database
      const newFile={
        File_Name:selectedFile.name
      }
      const fileExists = files.some(file => file.File_Name === newFile.File_Name);
      if (!fileExists) {
        // If no file with the same name exists, add the new file
        setFiles([...files, newFile]);
        // You can also perform the file upload operation here
      }
      else{
        console.log("File already exists");
        setShowFileExistsToast(true);
      }
      
    } catch (error) {
      // Handle error
      console.error("Error uploading file:", error);
    }
    setSelectedFile(null);
    handleClose();
  };

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Upload a new file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Browse File</Form.Label>
              <Form.Control type="file" onChange={handleFileChange}/>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpload}>
            Add File
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
