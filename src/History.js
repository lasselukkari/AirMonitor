import React, { PureComponent } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatetimeRangePicker from 'react-datetime-range-picker';
import transform from './transform'
import './App.css';

class Hiatory extends PureComponent {
  units = { CO2: 'ppm', TVOC: 'ppm', Temperature: '℃', Humidity: '%' }
  start = new Date()
  end = new Date()
  epochWeek = (date) => Math.floor(date.getTime() / 1000 / 86400);

  changeRange = ({ start, end }) => {
    this.start = start;
    this.end = end;

    this.fetchHistory();
  }

  fetchHistory = async () => {
    const start = this.epochWeek(this.start);
    const end = this.epochWeek(this.end);

    const response = await fetch(`/api/history?start=${start}&end=${end}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const buffer = await response.arrayBuffer();
    this.setState({ buffer })
  }

  async pollHistory() {
    try {
      this.fetchHistory();
    } finally {
      setTimeout(() => this.pollHistory(), 300000);
    }
  }

  getChart() {
    if (!this.state || !this.state.buffer) {
      return (<h3>Loading...</h3>)
    }

    if (this.state.buffer.byteLength <= 0) {
      return (<h3>No data for selected range</h3>)
    }

    return (
      <div style={{ height: "460px" }}>
        <ResponsiveContainer>
          <LineChart data={transform.getMany(this.state.buffer, 50)} >
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => `${value} ${this.units[name]}`} />
            <Line yAxisId="left" dot={false} type="monotone" dataKey="CO2" stroke="#143642" />
            <Line yAxisId="left" dot={false} type="monotone" dataKey="TVOC" stroke="#0F8B8D" />
            <Line yAxisId="right" dot={false} type="monotone" dataKey="Temperature" stroke="#EC9A29" />
            <Line yAxisId="right" dot={false} type="monotone" dataKey="Humidity" stroke="#A8201A" />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  componentDidMount() {
    this.pollHistory();
  }

  render() {
    return (
      <React.Fragment>
        <DatetimeRangePicker
          onChange={this.changeRange}
          timeFormat={false}
          className={"range-picker"}
          closeOnSelect
        />
        {this.getChart()}
      </React.Fragment>
    )
  }
}

export default Hiatory;
