import React, { PureComponent } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Colors from './Colors'
import transform from './transform'

import './Chart.css'

class Chart extends PureComponent {
  units = { CO2: 'ppm', TVOC: 'ppm', Temperature: '℃', Humidity: '%' }

  getLine(title, axis) {
    const { selected } = this.props;

    if (selected !== null && selected !== title) {
      return null;
    }

    return <Line
      yAxisId={axis}
      dot={selected !== null}
      type="monotone"
      dataKey={title}
      stroke={Colors[title]}
      strokeWidth={2}
    />
  }

  render() {
    const { buffer } = this.props;

    if (!buffer) {
      return (<h3 className="history-title">Loading...</h3>)
    }

    if (buffer.byteLength === 0) {
      return (<h3 className="history-title">No data for selected range</h3>)
    }

    return (
      <div className="chart-panel">
        <ResponsiveContainer>
          <LineChart data={transform.getMany(buffer)} >
            <XAxis
              dataKey="time"
              interval="preserveStartEnd"
              type={"number"}
              domain={['dataMin', 'dataMax']}
              tickCount={3}
              tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
              strokeWidth={2}
            />
            <YAxis yAxisId="left" strokeWidth={2} />
            <YAxis yAxisId="right" orientation="right" strokeWidth={2} />
            <Tooltip
              formatter={(value, name) => `${value.toFixed(2)} ${this.units[name]}`}
              labelFormatter={(ts) => new Date(ts).toLocaleString()}
            />
            {this.getLine("CO2", "left")}
            {this.getLine("TVOC", "left")}
            {this.getLine("Temperature", "right")}
            {this.getLine("Humidity", "right")}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }
}

export default Chart;
