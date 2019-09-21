import React, { PureComponent } from 'react';
import transform from './transform'

class Current extends PureComponent {
  async fetchCurrent() {
    const response = await fetch('/api/current');
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const buffer = await response.arrayBuffer();
    this.setState({ ...transform.getOne(buffer) });
  }

  async pollCurrent(interval) {
    try {
      this.fetchCurrent();
    } finally {
      setTimeout(async () => this.pollCurrent(interval), interval);
    }
  }

  componentDidMount() {
    this.pollCurrent(5000);
  }

  syncClock = async () => {
    await fetch(`/api/time`, {
      method: 'PUT',
      body: Math.floor((new Date().getTime() - Date.UTC(2000, 0, 1)) / 1000),
    });

    this.fetchCurrent();
  }

  render() {
    if (!this.state) {
      return null;
    }

    const { CO2, TVOC, Temperature, Humidity, time } = this.state;

    return (
      <React.Fragment>
        <h2 style={{ textAlign: "center" }}>
          Time: {time} <button onClick={this.syncClock}>Sync RTC</button> <br />
        </h2>
        <h3 style={{ textAlign: "center" }}>
          CO2: {CO2} TVOC: {TVOC} Temperature: {Temperature} Humidity: {Humidity}
        </h3>
      </React.Fragment>
    )
  }
}

export default Current;
