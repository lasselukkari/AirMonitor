import React, { PureComponent } from 'react';
import Current from './Current'
import History from './History'
import './App.css';

class App extends PureComponent {
  state = {
    CO2: true,
    TVOC: true,
    Temperature: true,
    Humidity: true
  }

  setSelected = (title) => this.setState((state) => ({ ...state, [title]: !state[title] }))

  render() {
    return (
      <React.Fragment>
        <Current setSelected={this.setSelected} selected={this.state} />
        <History selected={this.state} />
      </React.Fragment>
    )
  }
}

export default App;
