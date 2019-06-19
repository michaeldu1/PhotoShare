import React from 'react';
import './userDetail.css';
import {Link, RouterLink } from "react-router-dom";
import axios from 'axios';



/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {user: [], mostRecentPic: "", mostCommentedPic: ""};
  }

  componentDidMount() {
    // this.props.handler("alkfjAJLDKFJ");
    var url = "/user/" + this.props.match.params.userId;
    var self = this;
    var obj = axios(url);
    obj.then(function (res){
      self.setState({user: res.data});
      self.props.handler("Details of " + res.data.first_name);
    }).catch(function(error){
        console.log(error);
    })
    var recentPhoto = axios.get('/photosOfCurrUser/' + this.props.match.params.userId)
    recentPhoto.then(function(res){
      self.setState({mostRecentPic: res.data})
    })
    var mostCommented = axios.get('/topCommentPhoto/' + this.props.match.params.userId)
    mostCommented.then(function(res2){
      self.setState({mostCommentedPic: res2.data})
    })
  }

  componentDidUpdate(prevProps) {
    var currUrl = "/user/" + this.props.match.params.userId;
    var url = "/user/" + prevProps.match.params.userId;
    var self = this;
    if(currUrl !== url){
      var currObj = axios(currUrl);
      currObj.then(function (res){
        self.props.handler("Details of " + res.data.first_name);
        self.setState({user: res.data});
      }).catch(function(error){
          console.log(error);
      })
      var recentPhoto = axios.get('/photosOfCurrUser/' + this.props.match.params.userId)
      recentPhoto.then(function(res){
        self.setState({mostRecentPic: res.data})
      })
      var mostCommented = axios.get('/topCommentPhoto/' + this.props.match.params.userId)
      mostCommented.then(function(res2){
        self.setState({mostCommentedPic: res2.data})
      })
    }
    console.log("new id", this.props.match.params.userId)
  }


  render() {
    return (
      <div>
        <div className="header">
          {this.state && this.state.user.first_name+"'s Profile" }
        </div>
        <div className="container">
          <span className="bold">
            {this.state && "Full Name: "}
          </span>
          {this.state.user.first_name + " " + this.state.user.last_name}
        </div>
        <div className="container">
          <span className="bold">
            {this.state && "User id: "}
          </span>
          {this.state.user._id}
        </div>
        <div className="container">
          <span className="bold">
            {this.state && "Location: "}
          </span>
          {this.state && this.state.user.location}
        </div>
        <div className="container">
          <span className="bold">
            {this.state && "Description: "}
          </span>
          {this.state && this.state.user.description}
        </div>
        <div className="container">
          <span className="bold">
            {this.state && "Occupation: "}
          </span>
          {this.state && this.state.user.occupation}
        </div>
        <div>
          <Link to={"/photos/"+this.props.match.params.userId}>  <img src={"/images/" + this.state.mostRecentPic.file_name} className="image"/></Link>
        </div>
        <div>
          <Link to={"/photos/"+this.props.match.params.userId}>  <img src={"/images/" + this.state.mostCommentedPic.file_name} className="image"/></Link>
        </div>
        <div className="footer">
          <Link component = {RouterLink} to={"/photos/" + this.state.user._id}>{"Click here to access " + this.state.user.first_name + "'s photos!"}</Link>
        </div>
      </div>
    );
  }
}

export default UserDetail;
