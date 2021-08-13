import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import Amplify, { Storage } from 'aws-amplify';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

async function onChange(e) {
  debugger;
  const file = e.target.files[0];
  try {
    await Storage.put(file.name, file, {
      contentType: 'image/png' // contentType is optional
    });
  } catch (error) {
    console.log('Error uploading file: ', error);
    debugger;
  }  
}
    
class App extends Component {
  render() {
    return (
      <div className="App">
        <AmplifySignOut />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
  
          <h1>Hello, world!</h1>
          <input
            type="file"
            onChange={onChange}
          />
  
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default withAuthenticator(App);
