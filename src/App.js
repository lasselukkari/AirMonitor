import React, { PureComponent } from 'react';
import Current from './Current'
import History from './History'
import './App.css';

class App extends PureComponent {
  render() {
    return (
      <React.Fragment>
        <Current />
        <History />
      </React.Fragment>
    )
  }
}

export default App;
