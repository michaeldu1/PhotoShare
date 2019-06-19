import React from 'react';
import {
  ListItem,
}
from '@material-ui/core';
import './userList.css';
import { Link } from "react-router-dom";
import axios from 'axios'

/**
 * Define UserList, a React componment of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: [], last_activity: '', last_activity_dict: {},
    };
  }

  // componentDidUpdate(prevProps){
  //   if prevProps.msg diff from this.prop
  // }

  componentDidMount() {
    var self = this;
    var obj = axios("/user/list");
    obj.then(function (res){
      self.setState({inputValue: res.data});
    }).catch(function(error){
        console.log(error);
    });
  }

  getLastActivity(){
    var self = this
    var last = axios.get('/getLastActivity');
    last.then(function(res){
      console.log("RES IS ", res.data)
      self.setState({last_activity: res.data})
    })
  }

  getLast(){
    console.log("printing", this.props.last_activity)
    Object.keys(this.props.last_activity).map((photo) =>
        Object.keys(this.props.last_activity[photo]).map((a) =>
        console.log("AJLFK IS ", this.props.last_activity[photo][a])
      )
    )
  }

  render() {
    return (
      <div>
        {this.state && this.state.inputValue.map((person) =>
          <ListItem key={person._id} className="list">
            <Link to={"/users/" + person._id} replace>{person.first_name + " " + person.last_name}</Link>
          </ListItem>)
        }
      </div>
    );
  }
}

export default UserList;
