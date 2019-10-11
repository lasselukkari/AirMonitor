import React, { PureComponent } from 'react';
import Current from './Current'
import History from './History'
import './App.css';

class App extends PureComponent {
  state = {
    selected: null
  }

  setSelected = (selected) =>
    this.setState((state) => ({ selected: state.selected === selected ? null : selected }))

  render() {
    const { selected } = this.state;
    return (
      <React.Fragment>
        <Current setSelected={this.setSelected} selected={selected} />
        <History selected={selected} />
      </React.Fragment>
    )
  }
}

export default App;
