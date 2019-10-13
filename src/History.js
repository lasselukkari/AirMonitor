import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
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
    const start = this.epochDay(this.start);
    const end = this.epochDay(this.end);

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

  componentDidMount() {
    this.fetchRanges();
    this.pollHistory();
  }

  render() {
    const { selected } = this.props;
    const { start, end, buffer, ranges } = this.state;

    const StartButton = React.forwardRef(({ onClick }, ref) => (
      <button className="select react-datepicker__day--selected" onClick={onClick}>
        {start.toLocaleDateString()}
      </button>
    ));
    const EndButton = React.forwardRef(({ onClick }, ref) => (
      <button className="select react-datepicker__day--selected" onClick={onClick}>
        {end.toLocaleDateString()}
      </button>
    ));

    return (
      <React.Fragment>
        <Chart buffer={buffer} selected={selected} />
        <div className="range-picker">
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
      </React.Fragment>
    )
  }
}

export default History;
