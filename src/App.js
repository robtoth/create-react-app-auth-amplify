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

var Rebrandly = require("rebrandly")

class App extends Component {
  state = {
    rebrandly: new Rebrandly({
        apikey: "5149a0e582824fc898d76011444265f6"
        //workspace: "MEDDY_WORKSPACE"
    }),
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
          }).then( secure_amazon_uri => {
            
            // rebrandly - https://developers.rebrandly.com/docs/api-custom-url-shortener
            const rebrandly = this.state.rebrandly;
            
            // potentially consider using rebrandly's generated random links, although the low-character digit ones can potentially be hacked, so for now we'll use our own uuid4 generator:
            //const slashtag = uuidv4(); // <-- potentially can comment this line out if the client-side calculation of uuidv4 is somehow compromised (e.g. non-cryptographically secure pseudo-random-number-generator), and you want to instead trust rebrandly's server-side random link generation... hmm which is the better choice? I'll use server-side for now and trust they have secure random generation. -Dr. Toth, 2021-08-13
            rebrandly.links.create({destination: secure_amazon_uri,
                                    domain: { id: "5850f5fef9d44b8887aa8fb8e4791f48" }}
            ).then(rebrandly_result => {
              console.log(rebrandly_result);
              const rebrandly_short_url = rebrandly_result['shortUrl'];
              console.log(rebrandly_short_url);
              this.setState({sharable_link_uri: 'https://' + rebrandly_short_url})
            });
            
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
        <p className='warning'><b>Warning:</b> This is a prototype and not yet approved for clinical use. Until we have completed implementation of full server-side encryption and implemented a process for regular security audits, please do not submit sensitive data here.</p>
        <h1>Meddy Account Info</h1>
        <p><b>Email: </b>{this.state.email}</p>
        <p><b>Phone: </b>{this.state.phone}</p>
        <header className="App-header">
          <a href='https://meddyhealth.co/'>
            <img src={logo} className="App-logo" alt="logo" />
            <p>https://meddyhealth.co</p>
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
          
          {this.state.sharable_link_uri.length > 0 &&
            <h3><a href={this.state.sharable_link_uri} target='_blank'>{this.state.sharable_link_uri}</a></h3>
          }
          
          {this.state.last_update.length > 0 &&
            <p><b>Most recent data upload:</b> {this.state.last_update}</p>
          }
          
          <p>For help, please email <a href='mailto:support@meddyhealth.co'>support@meddyhealth.co</a></p>
          
        </div>
        <AmplifySignOut />
        
      </div>
    );
  }
}




export default withAuthenticator(App);

