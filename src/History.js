import React, { PureComponent } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatetimeRangePicker from 'react-datetime-range-picker';
import transform from './transform'
import './App.css';

class Hiatory extends PureComponent {
  units = { CO2: 'ppm', TVOC: 'ppm', Temperature: '℃', Humidity: '%' }

  getRange = async ({ start, end }) => {
    const epochWeek = (date) => Math.floor(date.getTime() / 1000 / 86400);
    const response = await fetch(`/api/history?start=${epochWeek(start)}&end=${epochWeek(end)}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const buffer = await response.arrayBuffer();
    this.setState({ buffer })
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
    this.getRange({ start: new Date(), end: new Date() });
  }

  render() {
    return (
      <React.Fragment>
        <DatetimeRangePicker
          onChange={this.getRange}
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
