import React, {useState} from 'react';
import ReactImageCrop from './ReactImageCrop';
import {Button, Modal} from "react-bootstrap";

const App = ()  => {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

  return (
    <div>
      <h1>React image crop</h1>
        <Button variant="primary" onClick={handleShow}>
            Upload Image
        </Button>

        <Modal show={show} onHide={handleClose}>
            <div style={{padding: "10px"}}>
                <ReactImageCrop/>
            </div>
        </Modal>
    </div>
  );
}

export default App;
