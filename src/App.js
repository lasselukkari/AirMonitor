import React, { Component } from 'react';
import TimeSeries from './TimeSeries.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.panels = [
      { name: 'CO2', unit: 'ppm' },
      { name: 'Temperature', unit: '℃' },
      { name: 'Humidity', unit: '%' }
    ]

    this.state = {
      status: 'Not connected',
      current: { co2: 0, temperature: 0.0, humidity: 0.0 },
      history: { co2: [], temperature: [], humidity: [], interval: 0 }
    };
  }

  async pollResource(name, interval) {
    try {
      const response = await fetch(`/api/${name}`);
      const result = await response.json();
      this.setState({ [name]: result, status: 'Connected', });
    } catch {
      this.setState({ status: 'Not connected', });
    } finally {
      const { interval } = this.state[name];
      setTimeout(async () => this.pollResource(name), interval);
    }
  }

  componentDidMount() {
    ['current', 'history'].forEach(name => this.pollResource(name))
  }

  getChart(name, unit, keyName) {
    const { history } = this.state;
    const { interval, age } = history;
    const data = history[keyName];

    return (
      <TimeSeries
        data={data}
        interval={interval}
        age={age}
        unit={unit}
        name={name} />
    )
  }

  getPanel(name, unit) {
    const { current } = this.state;
    const keyName = name.toLowerCase();
    const currentValue = current[keyName];
    const value = currentValue % 1 === 0 ? currentValue : currentValue.toFixed(2);

    return (
      <div key={name}>
        <h2>{name}: {value} {unit}</h2>
        {this.getChart(name, unit, keyName)}
      </div>
    )
  }
  render() {
    const { status } = this.state;

    return (
      <div>
        <h2>Status: {status}</h2>
        {this.panels.map(({ name, unit }) => this.getPanel(name, unit))}
      </div>
    )
  }
}

export default App;
