import React, { Component } from 'react';
import logo from './logo.png';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import Amplify, { Storage, Auth } from 'aws-amplify';

import aws_exports from './aws-exports';
console.log(aws_exports)
Amplify.configure(aws_exports);


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


class App extends Component {
  state = {
    email: "",
    imageName: "",
    imageFile: "",
    response: "",
    sharable_link_uri: 'https://meddyhealth.co'
  };

  uploadImage = () => {
    const file = this.upload.files[0];
    const filetype = file.type;
    const extension = file.name.split('.').pop();
    Storage.put(uuidv4() + '.' + extension,
                file,
                {
                  level: 'private',
                  contentType: filetype
                })
      .then(result => {
        this.upload = null;
        this.setState({ response: "Success uploading file! It may take a few minutes until that file is processed." });
      })
      .catch(err => {
        this.setState({ response: `Cannot upload file: ${err}` });
      });
  };

  updateSharableLink = () => {
    
    Auth.currentUserCredentials().then( credentials => {
      
      const identityId = credentials.identityId
      //console.log(identityId);
      
      Storage.get(identityId + '/test_upload.zip', {bucket: 'meddy-sharing'}).then( result => {
        console.log(result);
        this.setState({sharable_link_uri: result})
      }).catch( error => {
        console.error(error);
      });
    });
  }

  render() {
    
    return (
          
      <div className="App">
        <AmplifySignOut />
        <header className="App-header">
          <a href='https://meddyhealth.co/'>
            <img src={logo} className="App-logo" alt="logo" />
          </a>
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
        <p className='info'>Upload progress will be shown here.</p>
        
        <div className='sharable'>
          <h1>Sharable Link:</h1>
          <button onClick={this.updateSharableLink}>Generate Secure Link</button>
          
          <p className='info'>Note: This link expires in 15 minutes.</p>
          
          <h3><a href={this.state.sharable_link_uri} target='blank'>{this.state.sharable_link_uri}</a></h3>
          <p>For help, please email <a href='mailto:support@meddyhealth.co'>support@meddyhealth.co</a></p>
        </div>
        
      </div>
    );
  }
}




export default withAuthenticator(App);

