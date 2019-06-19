import React from 'react';
import axios from 'axios';
import './LoginRegister.css';

/**
 * Define TopBar, a React componment of CS142 project #5
 */
class LoginRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      val: '', password: ''
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
  }

  handleInputChange(event) {
    this.setState({ val: event.target.value });
  }

  handlePasswordChange(event) {
    this.setState({ password: event.target.value });
  }

  handleRegister() {
    // var register = axios.post('/user', )
    var login_name = document.forms["register_form"]["login_name"].value
    var password1 = document.forms["register_form"]["password1"].value
    var password2 = document.forms["register_form"]["password2"].value
    var first_name = document.forms["register_form"]["first_name"].value
    var last_name = document.forms["register_form"]["last_name"].value
    if(first_name === "" || last_name === "" || password1 === ""){
      window.alert("One or more property (First Name, Last Name, Password) may be empty.")
      return;
    } else if(password1 !== password2){
      window.alert("Passwords do not match.")
      return;
    } else{
      this.setState.password = password1
      var location = document.forms["register_form"]["location"].value
      var description = document.forms["register_form"]["description"].value
      var occupation = document.forms["register_form"]["occupation"].value

      axios.post('/user', {login_name: login_name, password: password1, first_name: first_name, last_name: last_name, location: location, description: description, occupation: occupation})
      window.alert("Successfully registered.")
    }
  }

  handleLogInClick(val){
    var self = this;
    var login = axios.post('/admin/login', {login_name: val, password: self.state.password});
    login.then(function(res){
      console.log("RES ISadfadf ", res)
      self.props.loginToggler(res.data.first_name, true, res.data._id, res.data.login_name)
      //update url to go bakc home
      self.props.history.push("/users/" + res.data._id)
      var last = axios.post('/updateLastActivity', {last_activity: 'Logged in'})
      last.then(function(res2){
        self.props.handleLastActivity(res2.data.last_activity, res.data._id)
      })
    }).catch(function(error){
      window.alert("unsuccesful login")
      console.log(error);
    })

  }

  render() {
    return (
      <div>
        <div className="login">
          <label>
            Username:
            <input type="text" value={this.state.val}
              onChange={(event) => this.handleInputChange(event)}
            />
          </label> <br/>
          <label>
            Password:
          </label>
          <input type="password" value={this.state.password}
            onChange={(event) => this.handlePasswordChange(event)}
          />
          <br/>
          <button onClick={() => this.handleLogInClick(this.state.val)}>
            Log In
          </button>
        </div>
        <div className="register">
          <form name="register_form">
            <label>
              Login Name*:
                <input type="text" name="login_name" className="info"/>
            </label> <br/>
            <label>
              Password*:
                <input type="password" name="password1" />
            </label> <br/>
            <label>
              Re-enter Password*:
                <input type="password" name="password2" />
            </label> <br/>
            <label>
              First Name*:
                <input type="text" name="first_name" />
            </label> <br/>
            <label>
              Last Name*:
                <input type="text" name="last_name" />
            </label> <br/>
            <label className="secondary">
              Location:
                <input type="text" name="location" />
            </label> <br/>
            <label className="secondary">
              Description:
                <input type="text" name="description" />
            </label> <br/>
            <label className="secondary">
              Occupation:
                <input type="text" name="occupation" />
            </label> <br/>
            <button onClick={() => this.handleRegister(this.state.val)}>
              Register
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default LoginRegister;
