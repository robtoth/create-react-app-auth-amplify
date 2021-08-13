import React, { Component } from 'react';
import logo from './logo.png';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import Amplify, { Storage, Auth } from 'aws-amplify';

import aws_exports from './aws-exports';
console.log(aws_exports)
Amplify.configure(aws_exports);



class App extends Component {
  state = {
    imageName: "",
    imageFile: "",
    response: ""
  };

  uploadImage = () => {
    Storage.put(`userimages/${this.upload.files[0].name}`,
                this.upload.files[0],
                {
                  level: 'private',
                  contentType: this.upload.files[0].type
                })
      .then(result => {
        this.upload = null;
        this.setState({ response: "Success uploading file!" });
      })
      .catch(err => {
        this.setState({ response: `Cannot upload file: ${err}` });
      });
  };

  render() {
    return (
          
      <div className="App">
        <AmplifySignOut />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Secure Uploader</h1>
        </header>
        
        <h2>Select a picture of your medical data and click <i>Upload File</i>:</h2>
        
        <input
          type="file"
          accept="image/png, image/jpeg"
          style={{ display: "none" }}
          ref={ref => (this.upload = ref)}
          onChange={e =>
            this.setState({
              imageFile: this.upload.files[0],
              imageName: this.upload.files[0].name
            })
          }
        />
        
        <input value={this.state.imageName} placeholder="Select file" />
        
        <button
          onClick={e => {
            this.upload.value = null;
            this.upload.click();
          }}
          loading={this.state.uploading}
        >
          Browse
        </button>

        <button onClick={this.uploadImage}> Upload File </button>

        {!!this.state.response && <div>{this.state.response}</div>}
        <p>Progress will be shown here.</p>
      </div>
    );
  }
}




export default withAuthenticator(App);

