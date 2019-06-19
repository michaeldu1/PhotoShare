import React from 'react';
import {
  AppBar, Toolbar, Typography
} from '@material-ui/core';
import './TopBar.css';
import Button from '@material-ui/core/Button';
import axios from 'axios';
import Modal from 'react-modal'
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};
/**
 * Define TopBar, a React componment of CS142 project #5
 */
class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {user: [], userProfile: [], msg: "", version:"", delete_account: false, allowedUsers: [this.props.login_name], input: ""};
    this.deleteAccount = this.deleteAccount.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.addUser = event => this.addUsers( event );
    this.changeHandler = event => this.handleChange( event );
  }

  componentDidMount() {
    this.setState({msg: this.props.msg, allowedUsers: [this.props.login_name]});
    this.getVersion();
  }

  openModal() {
    this.setState({modalIsOpen: true});
    console.log("allowed users", this.state.allowedUsers)
  }

  handleChange(evt){
    this.setState({
      input: evt.target.value,
    })
  }

  closeModal() {
    this.setState({
      modalIsOpen: false,
      input: "",
    });
    if(!this.state.allowedUsers.includes(this.props.login_name)){
      this.state.allowedUsers.push(this.props.login_name)
    }
  }

  addUsers(){
    this.state.allowedUsers.push(this.state.input)
    this.setState({
      input: ""
    })
  }

  getVersion(){
    var url = "http://localhost:3000/test/info";
    var self = this;
    var obj = axios(url);
    obj.then(function (res){
      self.setState({version: res.data.__v});
    }).catch(function(error){
      console.log(error);
    })
  }

  goToFavorites(){
    window.location='http://localhost:3000/photo-share.html#/favorites';
  }

  logout(){
    var self = this;
    var obj = axios.post("/admin/logout");
    obj.then(function(resp){
      self.props.loginToggler("Hi" + resp.data.first_name, false);
    }, function(){
      console.log("error")
    })
  }

  addPhoto(){
    var self = this;
    var obj = axios.post("/photos/new");
    obj.then(function(resp){
      self.props.loginToggler("Hi" + resp.data.first_name, true);
    }, function(){
      console.log("error")
    })
  }

  deleteAccount() {
    var self = this
    var x = axios.post('/deleteAccount');
    x.then(function() {
      self.logout();
    }, function() {
      console.log("error");
    });
  }

  changeConfid(confid) {
    this.setState({
      delete_account: confid
    });
  }

  firstDelete() {
    if(typeof(this.props.msg) !== 'undefined') {
      return (
        <button onClick={() => this.changeConfid(true)}>Delete Account</button>
      );
    }
  }

  confidDeleteAccount() {
    if(typeof(this.props.msg) !== 'undefined') {
      return (
        <button id="firstDelete" onClick={this.deleteAccount}>Are you sure?</button>
      );
    }
  }

  render() {
    var self = this
    console.log("props is", this.props)
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar className="container">
          <Typography variant="h5" color="inherit">
            Michael Du
          </Typography>
          <Typography variant="h5" color="inherit" className="version">
            {"Version: " + this.state.version}
          </Typography>
          <Typography variant="h5" color="inherit" className="info">
            {this.props.msg}
          </Typography>
          {this.props.state.userIsLoggedIn ?
            <div>
              <Button color="inherit" onClick={() => {this.goToFavorites()}}>
                Favorites
              </Button>

              {this.props.state.userIsLoggedIn ?
                <button onClick={this.openModal}>Add Photo</button>
                  :
                  <div/>
              }
              <Modal
                  isOpen={this.state.modalIsOpen}
                  onAfterOpen={this.afterOpenModal}
                  onRequestClose={this.closeModal}
                  contentLabel="Example Modal"
                  ariaHideApp={false}
                  style={customStyles}
                >
                <input className="user-input" value={ this.state.input} type="text" onChange= {this.changeHandler} />

                <button type="button" onClick={e => this.addUser(e)}>
                    Add user
                </button>
                <div>
                {this.state.allowedUsers.toString()}
                </div>
                <div>
                <input type="file" accept="image/*" ref={(domFileRef) => { this.uploadInput = domFileRef; }} />
                <Button onClick={(event) => {
                  event.preventDefault();
                  if (this.uploadInput.files.length > 0) {
                    const domForm = new FormData();
                    domForm.append('uploadedphoto', this.uploadInput.files[0]);
                    axios.post('/photos/new', domForm  )
                    .then(() => {
                      var link = '/addAllowedUsers/' + self.props.user_id
                      console.log("thiskjlajdflk l", this.state.allowedUsers)
                      return axios.post( link, { allowedUsers: this.state.allowedUsers} )
                    }).catch(err => console.log(`POST ERR: ${err}`)).then(()=> {
                    }).catch(function(error){
                      console.log(error)
                    })
                  }
                }}>
                Add Photo
                </Button>
                </div>
                <button onClick={this.closeModal}>close</button>

              </Modal>

              <Button onClick={() => {this.logout()}}>
                Log Out
              </Button>
              {
                <div>
                  {this.state.delete_account ?
                    this.confidDeleteAccount()
                    :
                    this.firstDelete()
                  }
                </div>
              }
              <Typography variant="h5" color="textPrimary" className="info">
                {"Hi, " + this.props.state.first_name}
              </Typography>
            </div>
            :
            <div>
              <Typography variant="h5" color="inherit" className="info">
                Please Login
              </Typography>
            </div>
          }
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
