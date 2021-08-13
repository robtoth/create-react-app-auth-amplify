import React, { Component } from 'react';
import logo from './logo.png';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import Amplify, { Storage, Auth } from 'aws-amplify';

import aws_exports from './aws-exports';
Amplify.configure(aws_exports);


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


class App extends Component {
  state = {
    expire_minutes: 10,
    last_update: '',
    email: "loading...",
    phone: "loading...",
    imageName: "",
    imageFile: "",
    response: "",
    sharable_link_uri: ''
  };

  async componentDidMount() {
    let user = await Auth.currentAuthenticatedUser();
    const { attributes } = user;
    //console.log('Attributes = ')
    //console.log(attributes)
    const email = attributes['email'];
    const phone = attributes['phone_number'];
    this.setState({ email });
    this.setState({ phone });
  }
  
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
      
      const bucket = 'meddy-sharing';
      Storage.list(identityId, {bucket: bucket}).then( result => {
        console.log(result)
        
        let most_recent_date = null;
        let most_recent_key = null;
        
        for (const sharable_file of result) {
          const last_modified = new Date(sharable_file['lastModified'])
          //console.log(last_modified);
          if (most_recent_date === null || last_modified > most_recent_date) {
            most_recent_date = last_modified;
            most_recent_key = sharable_file['key'];
          }
        }
        
        if (most_recent_key === null) {
          alert('Error: No files uploaded. Please wait a few minutes if you just uploaded something.');
          this.setState({sharable_link_uri: 'https://meddyhealth.co'});
        } else {
          console.log(most_recent_date)
          this.setState({last_update: most_recent_date.toString()});
          //this.setState({ last_update });
          const expire_minutes = this.state.expire_minutes;
          const expire_seconds = expire_seconds * 60;
          Storage.get(most_recent_key,
                      {bucket: bucket,
                       expires: expire_seconds
                      }).then( result => {
            this.setState({sharable_link_uri: result})
          }).catch( error => {
            console.error(error);
          });
        }
      
      }).catch(err => console.error(err));
      
    });
  }

  render() {
    
    return (
          
      <div className="App">
        <AmplifySignOut />
        <p><b>Email: </b>{this.state.email}</p>
        <p><b>Phone: </b>{this.state.phone}</p>
        <header className="App-header">
          <a href='https://meddyhealth.co/'>
            <img src={logo} className="App-logo" alt="logo" />
          </a>
          <h1>Secure Uploader</h1>
        
        </header>
        
        <h2>Upload a PNG, JPG, or PDF file of your medical data:</h2>
        
        <input
          type="file"
          accept="image/png, image/jpeg, application/pdf"
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
          
          {this.state.sharable_link_uri.length > 0 &&
            <p className='info'>Note: This link expires in <b>{this.state.expire_minutes}</b> minutes.</p>
          }
          
          {this.state.last_update.length > 0 &&
            <p><b>Most recent data upload:</b> {this.state.last_update}</p>
          }
          
          {this.state.sharable_link_uri.length > 0 &&
            <h3><a href={this.state.sharable_link_uri} target='blank'>{this.state.sharable_link_uri}</a></h3>
          }
          
          <p>For help, please email <a href='mailto:support@meddyhealth.co'>support@meddyhealth.co</a></p>
          
        </div>
        
      </div>
    );
  }
}




export default withAuthenticator(App);

