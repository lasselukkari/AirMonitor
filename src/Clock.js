import React, { PureComponent } from 'react';

class Clock extends PureComponent {
  syncClock = async () => {
    await fetch(`/api/time`, {
      method: 'PUT',
      body: Math.floor((new Date().getTime() - Date.UTC(2000, 0, 1)) / 1000),
    });

    this.props.onUpdate();
  }

  render() {
    const time = new Date(this.props.time).toLocaleString()

    return (
      <button title="Sync RTC" id="timestamp" onClick={this.syncClock}>{time}</button>
    )
  }
}

export default Clock;
