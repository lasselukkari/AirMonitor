import React, { PureComponent } from 'react';

class Connection extends PureComponent {
  state = { ssid: "", password: "", connecting: false }

  async createConnnection() {
    this.setState({connecting: true});
    try {
      const { ssid, password } = this.state;
      const formData = new FormData();
      formData.append('ssid', ssid);
      formData.append('password', password);
      const data = new URLSearchParams(formData);
  
      const response = await fetch('/api/connection', {
        method: 'POST',
        body: data,
      });

      const connection = await response.text();
      this.setState({ connection });
    } finally  {
      this.setState({connecting: false})
    }
  }

  async fetchConnection() {
    const response = await fetch('/api/connection');
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const connection = await response.text();
    this.setState({ connection });
  }

  removeConnection = () => {
    this.setState({ connection: null });
    fetch('/api/connection', { method: 'DELETE' })
  }

  componentDidMount() {
    this.fetchConnection();
  }

  handleSSIDChange = ({ target }) => this.setState({ ssid: target.value })
  handlePasswordChange = ({ target }) => this.setState({ password: target.value });

  handleSubmit = (e) => {
    e.preventDefault();
    return this.createConnnection();
  }

  render() {
    const { connection, ssid, password, connecting } = this.state;

    if(connecting){
      return  (<React.Fragment>Connecting...</React.Fragment>)
    }

    if (connection) {
      return (<button title="Diconnect" onClick={this.removeConnection} >{this.state.connection}</button>)
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <input type="text" placeholder="SSID" value={ssid} onChange={this.handleSSIDChange} />
        <input type="text" placeholder="Password" value={password} onChange={this.handlePasswordChange} />
        <input type="submit" value="Connect" />
      </form>
    )
  }
}

export default Connection;
