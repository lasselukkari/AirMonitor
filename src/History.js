import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import download from 'downloadjs'
import Chart from './Chart'
import transform from './transform'
import './History.css';

import "react-datepicker/dist/react-datepicker.css";

class History extends Component {
  state = {
    start: new Date(),
    end: new Date()
  }
  start = new Date()
  end = new Date()
  epochDay = (date) => Math.floor(date.getTime() / 1000 / 86400);

  changeStart = (start) => {
    this.start = start;
    this.fetchHistory();
  }

  changeEnd = (end) => {
    this.end = end;
    this.fetchHistory();
  }

  fetchRanges = async () => {
    const response = await fetch('/api/ranges');
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const buffer = await response.arrayBuffer();

    const ranges = transform.getRanges(buffer);

    this.setState({ ranges })
  }

  fetchHistory = async () => {
    const start = this.epochDay(this.start) - 1;
    const end = this.epochDay(this.end) + 1;

    const response = await fetch(`/api/history?start=${start}&end=${end}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const buffer = await response.arrayBuffer();
    this.setState({ buffer, start: this.start, end: this.end })
  }

  async pollHistory() {
    try {
      this.fetchHistory();
    } finally {
      setTimeout(() => this.pollHistory(), 300000);
    }
  }

  exportCSV = () => {
    const { start, end, buffer } = this.state;
    const items = transform.getMany(buffer);
    const keys = Object.keys(items[0]);
    const data = items.map(row => keys.map(key => row[key]).join(','));
    const csv = `${keys}\r\n${data.join('\r\n')}`;
    const startDate = start.toLocaleDateString();
    const endDate = end.toLocaleDateString();
    const filename = `AirMonitor-${startDate}-${endDate}.csv`;
    download(csv, filename, "text/csv");
  }

  componentDidMount() {
    this.fetchRanges();
    this.pollHistory();
  }

  getLocalizedRange() {
    const { start, end, buffer } = this.state;
    const startDate = new Date(start);
    const endDate = new Date(end);

    startDate.setHours(0, 0, 0);
    endDate.setHours(0, 0, 0);
    endDate.setDate(endDate.getDate() + 1);

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return transform.getMany(buffer).filter(({ Timestamp }) =>
      (Timestamp > startTime) && (Timestamp < endTime));
  }

  render() {
    const { selected } = this.props;
    const { start, end, ranges } = this.state;

    const StartButton = React.forwardRef(({ onClick }, ref) => (
      <button className="control-button range-select" onClick={onClick}>
        {start.toLocaleDateString()}
      </button>
    ));
    const EndButton = React.forwardRef(({ onClick }, ref) => (
      <button className="control-button range-select" onClick={onClick}>
        {end.toLocaleDateString()}
      </button>
    ));

    return (
      <React.Fragment>
        <Chart data={this.getLocalizedRange()} selected={selected} />
        <div className="control-container">
          <DatePicker
            customInput={<StartButton />}
            onChange={this.changeStart}
            selected={start}
            includeDates={ranges}
            startDate={start}
            endDate={end}
            maxDate={end}
            selectsStart
          />
          <DatePicker
            customInput={<EndButton />}
            onChange={this.changeEnd}
            selected={end}
            includeDates={ranges}
            startDate={start}
            endDate={end}
            minDate={start}
            selectsEnd
          />
        </div>
        <div className="control-container">
          <button className="control-button" onClick={this.exportCSV}>
            Export CSV
          </button>
        </div>
      </React.Fragment>
    )
  }
}

export default History;
