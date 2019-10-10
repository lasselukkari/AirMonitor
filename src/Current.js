import React, { PureComponent } from 'react';
import transform from './transform'
import Colors from './Colors'
import './Current.css'

class Current extends PureComponent {
  units = { CO2: 'ppm', TVOC: 'ppm', Temperature: '℃', Humidity: '%' }

  async fetchCurrent() {
    const response = await fetch('/api/current');
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const buffer = await response.arrayBuffer();
    this.setState({ ...transform.getOne(buffer) });
  }

  async pollCurrent() {
    try {
      this.fetchCurrent();
    } finally {
      setTimeout(async () => this.pollCurrent(), 5000);
    }
  }

  componentDidMount() {
    this.pollCurrent();
  }

  syncClock = async () => {
    await fetch(`/api/time`, {
      method: 'PUT',
      body: Math.floor((new Date().getTime() - Date.UTC(2000, 0, 1)) / 1000),
    });

    this.fetchCurrent();
  }

  getPanel(title, color) {
    return (
      <div className="value-panel" style={{ backgroundColor: color }}>
        <div className="value-container">
          <h2>{title}</h2>
          <div className="value">
            {this.state[title]} {this.units[title]}
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <React.Fragment>
        <div className="timestamp">
          <button title="Sync RTC" onClick={this.syncClock}>{this.state.time}</button>
        </div>
        {this.getPanel('CO2', Colors.C02)}
        {this.getPanel('TVOC', Colors.TVOC)}
        {this.getPanel('Temperature', Colors.Temperature)}
        {this.getPanel('Humidity', Colors.Humidity)}
      </React.Fragment>
    )
  }
}

export default Current;
