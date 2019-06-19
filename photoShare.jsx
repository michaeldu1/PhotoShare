import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Paper
} from '@material-ui/core';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import LoginRegister from './components/loginPage/LoginRegister';
import CommentInput from './components/addComment/CommentInput';
import UserFavorites from './components/favorites/UserFavorites';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
    this.loginToggler = this.loginToggler.bind(this);
    this.handleFavorites = this.handleFavorites.bind(this);
    this.handleLastActivity = this.handleLastActivity.bind(this);
    this.state = {msg: "", userIsLoggedIn: false, first_name: "", photoid:"", imgSource:"", userId:"", logged_in_id:"", last_activity: {}, login_name:"", allowedUsers: []}
    this.photoIdHandler = event => this.handlePic( event );
  }

  handlePic(pic) {
    this.setState({photoid:pic});
  }


  handleLastActivity(activity, user_id){
    this.setState({last_activity: activity, userId: user_id})
  }

  handleFavorites(source, userId) {
    this.setState({imgSource:source});
    this.setState({userId:userId});
  }

  handler(val){
    this.setState({
      msg: val
    });
  }

  loginToggler(name, val, id, login_name){
    this.setState({
      userIsLoggedIn: val, first_name: name, logged_in_id: id, login_name: login_name,
    });
  }

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar msg={this.state.msg} loginToggler={this.loginToggler} state={this.state} user_id={this.state.userId} login_name={this.state.login_name}/>
        </Grid>
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3}>
          <Paper  className="cs142-main-grid-item">
            {this.state.userIsLoggedIn ? <UserList last_activity={this.state.last_activity} user_id={this.state.userId}/> : <div/>}
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item">
            <Switch>
            <Route path="/login-register"
              render={ props => <LoginRegister loginToggler={this.loginToggler} handleLastActivity={this.handleLastActivity}{...props}/> }
            />
            <Route path="/commentInput"
              render ={ props => <CommentInput photoid = {this.state.photoid} handleLastActivity={this.handleLastActivity}{...props} /> }
            />
            <Route path="/favorites"
              render ={ props => <UserFavorites source={this.state.imgSource} userId={this.state.userId} {...props} /> }
            />
            {this.state.userIsLoggedIn ?
              <Route path="/users/:userId"
                render={ props => <UserDetail handler={this.handler} {...props}/> }
              />
              :
              <Redirect path="/users/:userId" to="/login-register"
                render={ props => <LoginRegister loginToggler={this.loginToggler} {...props}/> }
              />
            }
            {
              this.state.userIsLoggedIn ?
              <Route path="/photos/:userId"
                render = {props => <UserPhotos handler={this.handler} changePhotoId={this.photoIdHandler} handleFavorites={this.handleFavorites} curr_id={this.state.logged_in_id} allowedUsers={this.state.allowedUsers}{...props}/>}
              />
              :
              <Redirect path="/photos/:userId" to="/login-register" />
            }

            {
              this.state.userIsLoggedIn ?
              <Route exact path="/" render ={ () => <UserList last_activity={this.state.last_activity} user_id={this.state.userId}/>} />
              :
              <Redirect path="/" to="/login-register" />
            }

            {
              this.state.userlogged ?
                <Route path="/commentInput" component={CommentInput}
              />
              :
              <Redirect path="/commentInput" to="/login-register"/>
            }

            {
              this.state.userlogged ?
                <Route path="/favorites" component={UserFavorites}
              />
              :
              <Redirect path="/favorites" to="/login-register"/>
            }

            <Route path='/' component={LoginRegister}/>
            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
    </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
