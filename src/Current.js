import React, { PureComponent } from 'react';
import Color from 'color'
import transform from './transform'
import Colors from './Colors'
import Connection from './Connection'
import Clock from './Clock'
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

  syncClock = async () => {
    await fetch(`/api/time`, {
      method: 'PUT',
      body: Math.floor((new Date().getTime() - Date.UTC(2000, 0, 1)) / 1000),
    });

    this.fetchCurrent();
  }

  getPanel(title) {
    const color = Colors[title];
    const { setSelected, selected } = this.props;
    const lightColor = Color(color).alpha(0.5).lighten(0.5);
    const panelStyle = { backgroundColor: color };
    const containerStyle = { backgroundColor: selected === title ? lightColor : color };
    const value = this.state[title] !== undefined ? this.state[title].toFixed(2) : "..."

    return (
      <div onClick={() => setSelected(title)} className="value-panel" style={panelStyle}>
        <div className="value-container" style={containerStyle}>
          <h2>{title}</h2>
          <div className="value">
            {value} {this.units[title]}
          </div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    this.pollCurrent();
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <React.Fragment>
        <div className="info">
          <Connection />
          <Clock time={this.state.time} onUpdate={() => this.fetchCurrent()} />
        </div>
        {this.getPanel('CO2', Colors.CO2)}
        {this.getPanel('TVOC', Colors.TVOC)}
        {this.getPanel('Temperature', Colors.Temperature)}
        {this.getPanel('Humidity', Colors.Humidity)}
      </React.Fragment>
    )
  }
}

export default Current;
