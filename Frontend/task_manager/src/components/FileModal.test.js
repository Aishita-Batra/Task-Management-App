import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import FileModal from './FileModal';
import { fetchPreSignedURL, addFile } from '../controllers/fileops';
import { BrowserRouter as Router } from 'react-router-dom';
jest.mock('axios');
jest.mock('../controllers/fileops', () => ({
  fetchPreSignedURL: jest.fn(),
  addFile: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ project_id: '123', task_id: '456' }),
}));
describe('FileModal', () => {
  const mockHandleClose = jest.fn();
  const mockSetFiles = jest.fn();
  const mockSetShowFileExistsToast = jest.fn();
  const files = [
    { File_Name: 'file1.txt' },
    { File_Name: 'file2.txt' },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders modal correctly when show is true', () => {
    render(
      <Router>
        <FileModal
          show={true}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    expect(screen.getByText(/upload a new file/i)).toBeInTheDocument();
    expect(screen.getByText(/browse file/i)).toBeInTheDocument();
    expect(screen.getByText(/close/i)).toBeInTheDocument();
    expect(screen.getByText(/add file/i)).toBeInTheDocument();
  });
  test('does not render modal when show is false', () => {
    render(
      <Router>
        <FileModal
          show={false}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    expect(screen.queryByText(/upload a new file/i)).not.toBeInTheDocument();
  });
  test('handles file selection', () => {
    render(
      <Router>
        <FileModal
          show={true}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/browse file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });
  test('calls handleClose when Close button is clicked', () => {
    render(
      <Router>
        <FileModal
          show={true}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    fireEvent.click(screen.getByText(/close/i));
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });
  test('handles file upload successfully', async () => {
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });
    fetchPreSignedURL.mockResolvedValue({ presignedUrl: 'http://example.com', statusCode: 200 });
    addFile.mockResolvedValue({ success: true });
    axios.put.mockResolvedValue({ status: 200 });
    render(
      <Router>
        <FileModal
          show={true}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    const fileInput = screen.getByLabelText(/browse file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/add file/i));
    await screen.findByText(/upload a new file/i);
    expect(fetchPreSignedURL).toHaveBeenCalledWith('123', '456', 'example.txt', 'text/plain');
    expect(axios.put).toHaveBeenCalledWith('http://example.com', file, expect.any(Object));
    expect(addFile).toHaveBeenCalledWith('123', '456', 'example.txt');
    expect(mockSetFiles).toHaveBeenCalledWith([...files, { File_Name: 'example.txt' }]);
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });
  test('handles file upload failure', async () => {
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });
    fetchPreSignedURL.mockResolvedValue({ presignedUrl: 'http://example.com', statusCode: 200 });
    axios.put.mockRejectedValue(new Error('Upload failed'));
    render(
      <Router>
        <FileModal
          show={true}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    const fileInput = screen.getByLabelText(/browse file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/add file/i));
    await screen.findByText(/upload a new file/i);
    expect(fetchPreSignedURL).toHaveBeenCalledWith('123', '456', 'example.txt', 'text/plain');
    expect(axios.put).toHaveBeenCalledWith('http://example.com', file, expect.any(Object));
    expect(mockSetFiles).not.toHaveBeenCalled();
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });
//   test('shows file exists toast when file already exists', async () => {
//     const file = new File(['dummy content'], 'file1.txt', { type: 'text/plain' });
//     fetchPreSignedURL.mockResolvedValue({ presignedUrl: 'http://example.com', statusCode: 200 });
//     render(
//       <Router>
//         <FileModal
//           show={true}
//           handleClose={mockHandleClose}
//           files={files}
//           setFiles={mockSetFiles}
//           setShowFileExistsToast={mockSetShowFileExistsToast}
//         />
//       </Router>
//     );
//     const fileInput = screen.getByLabelText(/browse file/i);
//     fireEvent.change(fileInput, { target: { files: [file] } });
//     fireEvent.click(screen.getByText(/add file/i));
//     await screen.findByText(/upload a new file/i);
//     expect(fetchPreSignedURL).toHaveBeenCalledWith('123', '456', 'file1.txt', 'text/plain');
//     expect(mockSetFiles).not.toHaveBeenCalled();
//     expect(mockSetShowFileExistsToast).toHaveBeenCalledTimes(1);
//     expect(mockHandleClose).toHaveBeenCalledTimes(1);
//   });
  test('handles fetchPreSignedURL error', async () => {
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });
    fetchPreSignedURL.mockResolvedValue({ statusCode: 400 });
    render(
      <Router>
        <FileModal
          show={true}
          handleClose={mockHandleClose}
          files={files}
          setFiles={mockSetFiles}
          setShowFileExistsToast={mockSetShowFileExistsToast}
        />
      </Router>
    );
    const fileInput = screen.getByLabelText(/browse file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/add file/i));
    await screen.findByText(/upload a new file/i);
    expect(fetchPreSignedURL).toHaveBeenCalledWith('123', '456', 'example.txt', 'text/plain');
    expect(mockSetFiles).not.toHaveBeenCalled();
    expect(mockSetShowFileExistsToast).toHaveBeenCalledTimes(1);
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });
});