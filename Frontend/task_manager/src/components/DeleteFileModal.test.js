import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteFileModal from './DeleteFileModal';
import { deleteFile } from '../controllers/fileops';
import { BrowserRouter as Router } from 'react-router-dom';
jest.mock('../controllers/fileops', () => ({
  deleteFile: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ project_id: '123', task_id: '456' }),
}));
describe('DeleteFileModal', () => {
  const mockHandleClose = jest.fn();
  const mockSetFiles = jest.fn();
  const fileToBeDeleted = 'file1.txt';
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
        <DeleteFileModal
          show={true}
          handleClose={mockHandleClose}
          fileToBeDeleted={fileToBeDeleted}
          files={files}
          setFiles={mockSetFiles}
        />
      </Router>
    );
    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete this file\?/i)).toBeInTheDocument();
    expect(screen.getByText(/no/i)).toBeInTheDocument();
    expect(screen.getByText(/yes/i)).toBeInTheDocument();
  });
  test('does not render modal when show is false', () => {
    render(
      <Router>
        <DeleteFileModal
          show={false}
          handleClose={mockHandleClose}
          fileToBeDeleted={fileToBeDeleted}
          files={files}
          setFiles={mockSetFiles}
        />
      </Router>
    );
    expect(screen.queryByText(/confirm deletion/i)).not.toBeInTheDocument();
  });
  test('calls handleClose when No button is clicked', () => {
    render(
      <Router>
        <DeleteFileModal
          show={true}
          handleClose={mockHandleClose}
          fileToBeDeleted={fileToBeDeleted}
          files={files}
          setFiles={mockSetFiles}
        />
      </Router>
    );
    fireEvent.click(screen.getByText(/no/i));
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });
  test('calls deleteFile and setFiles when Yes button is clicked', async () => {
    deleteFile.mockResolvedValue({ success: true });
    render(
      <Router>
        <DeleteFileModal
          show={true}
          handleClose={mockHandleClose}
          fileToBeDeleted={fileToBeDeleted}
          files={files}
          setFiles={mockSetFiles}
        />
      </Router>
    );
    fireEvent.click(screen.getByText(/yes/i));
    expect(deleteFile).toHaveBeenCalledWith('123', '456', 'file1.txt');
    await screen.findByText(/confirm deletion/i);
    expect(mockSetFiles).toHaveBeenCalledWith([{ File_Name: 'file2.txt' }]);
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });
//   test('handles deleteFile failure gracefully', async () => {
//     deleteFile.mockRejectedValue(new Error('Delete failed'));
//     render(
//       <Router>
//         <DeleteFileModal
//           show={true}
//           handleClose={mockHandleClose}
//           fileToBeDeleted={fileToBeDeleted}
//           files={files}
//           setFiles={mockSetFiles}
//         />
//       </Router>
//     );
//     fireEvent.click(screen.getByText(/yes/i));
//     expect(deleteFile).toHaveBeenCalledWith('123', '456', 'file1.txt');
//     await screen.findByText(/confirm deletion/i);
//     // Ensure handleClose is still called despite the error
//     expect(mockHandleClose).toHaveBeenCalledTimes(1);
//   });
});






