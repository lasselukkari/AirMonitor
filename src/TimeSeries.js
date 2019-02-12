import React, { Component } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import windowSize from 'react-window-size';

class TimeSeries extends Component {
  shouldComponentUpdate({ data }) {
    const { data: oldData } = this.props;
    return data.length !== oldData.length || !data.every((value, index) => value === oldData[index])
  }

  getTimeSeries(data, interval, name, age) {
    const count = data.length;
    var dateNow = new Date();
    var firstTS = new Date(dateNow.getTime() - (interval * (count - 1))).getTime() - age;

    return data.map((value, index) => ({ timestamp: firstTS + (interval * index), [name]: value }));
  }

  render() {
    const { data, interval, unit, windowWidth, name, age } = this.props;
    return (
      <LineChart width={windowWidth - 60} height={120} data={this.getTimeSeries(data, interval, name, age)}>
        <XAxis dataKey="timestamp" type='number'
          tickFormatter={(timestamp) => {
            const date = new Date(timestamp)
            const hours = date.getHours()
            const minutes = ("0" + date.getMinutes()).slice(-2);
            return `${hours}:${minutes}`
          }}
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} formatter={(value) => value + ' ' + unit} />
        <YAxis domain={['dataMin', 'dataMax']} />
        <Line type="monotone" dataKey={name} stroke="#8884d8" dot={false}
          strokeWidth={3} />
      </LineChart>
    );
  }
}

export default windowSize(TimeSeries);
