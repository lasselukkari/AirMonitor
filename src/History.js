import React, { PureComponent } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DatetimeRangePicker from 'react-datetime-range-picker';
import Colors from './Colors'
import transform from './transform'
import './History.css';

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
      return (<h3 className="history-title">Loading...</h3>)
    }

    if (this.state.buffer.byteLength <= 0) {
      return (<h3 className="history-title">No data for selected range</h3>)
    }

    const { selected } = this.props;

    return (
      <div className="history-panel">
        <ResponsiveContainer height={300}>
          <LineChart data={transform.getMany(this.state.buffer)} >
            <XAxis dataKey="time" tick={false} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => `${value} ${this.units[name]}`} />
            {(selected === null || selected === "CO2") &&
              <Line yAxisId="left" dot={false} type="monotone" dataKey="CO2" stroke={Colors.C02} />
            }
            {(selected === null || selected === "TVOC") &&
              <Line yAxisId="left" dot={false} type="monotone" dataKey="TVOC" stroke={Colors.TVOC} />
            }
            {(selected === null || selected === "Temperature") &&
              <Line yAxisId="right" dot={false} type="monotone" dataKey="Temperature" stroke={Colors.Temperature} />
            }
            {(selected === null || selected === "Humidity") &&
              <Line yAxisId="right" dot={false} type="monotone" dataKey="Humidity" stroke={Colors.Humidity} />
            }
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
        {this.getChart()}
        <DatetimeRangePicker
          onChange={this.changeRange}
          timeFormat={false}
          className={"range-picker"}
          closeOnSelect
        />
      </React.Fragment>
    )
  }
}

export default Hiatory;
