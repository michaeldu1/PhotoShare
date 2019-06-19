import React from 'react';
import axios from 'axios';
import './CommentInput.css';

class CommentInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comment: ""
    }
    this.onClickHandler = event => this.addComment(event);
    this.changeHandlerBound = event => this.handleText(event);
  }

  handleText(e){
    this.setState({
      comment: e.target.value,
    })
  }

  addComment(){
    var self = this;
    var link = '/commentsOfPhoto/' + this.props.photoid;
    var add = axios.post( link,
      { comment: this.state.comment }
    );
    add.then( function(res) {
      self.props.history.push("/photos/" + res.data.user_id);
      var last = axios.post('/updateLastActivity', {last_activity: 'Added a comment'})
      last.then(function(res2){
        console.log("LOGGED IN IS ", res)
        self.props.handleLastActivity(res2, res.data.user_id)
      })
    }).catch(function(err){
      console.log(err);
    })
  }

  render() {
    return (
      <div>
        <div className="title">
          Add a comment!
        </div>
        <input value={ this.state.comment} className="input" type="text" onChange= {this.changeHandlerBound} />
        <button className = "button" type="button" onClick= {e => this.onClickHandler(e)}>
          Add Comment
        </button>
      </div>
    );
  }
}

export default CommentInput;
