import React from 'react';
import './userPhotos.css';
import {Link } from "react-router-dom";
import axios from 'axios';

/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {userProfile: [], showFavoritesButton: true, favorites: [], curr_photo: "", user_likes: [], num_likes: 0};
    this.onInputHandler = event => this.handleInput( event );
    this.likePhoto = this.likePhoto.bind(this);

  }

  componentDidMount() {
    var url = "/photosOfUser/" + this.props.match.params.userId;
    var self = this;
    console.log("PHOTOS IMP ", this.props.allowedUsers)
    var obj = axios.get(url, {allowedUsers: this.props.allowedUsers});
    obj.then(function (res){
      self.setState({userProfile: res.data});
    }, function (err) {
      console.log(err)
    })
    var obj2 = axios.get("/user/"+this.props.match.params.userId)
    obj2.then(function(res2){
      self.props.handler("Photos of " + res2.data.first_name);
    }, function(err){
      console.log(err)
    })
    this.addButton()
    var obj3 = axios.get('/getLikePhotoUser/', {userid: this.props.curr_id})
    obj3.then(function(res){
      self.setState({user_likes: res.data})
    })
  }

  refresh(){
    var url = "/photosOfUser/" + this.props.match.params.userId;
    var self = this;
    var obj = axios.get(url, {allowedUsers: this.props.allowedUsers});
    obj.then(function (res){
      self.setState({userProfile: res.data});
    }, function (err) {
      console.log(err)
    })
    var obj2 = axios.get("/user/"+this.props.match.params.userId)
    obj2.then(function(res2){
      self.props.handler("Photos of " + res2.data.first_name);
    }, function(err){
      console.log(err)
    })
    this.addButton()
    var obj3 = axios.get('/getLikePhotoUser/', {userid: this.props.curr_id})
    obj3.then(function(res){
      self.setState({user_likes: res.data})
    })
  }

  handleInput(pic){
    this.props.changePhotoId(pic._id);
    this.props.history.push("/commentInput/")

    // window.location='http://localhost:3000/photo-share.html#/commentInput';
  }

  handleFavorites(imgSource, userId){
    var self = this
    this.props.handleFavorites(imgSource, userId)
    var obj = axios.post('/addToFavorites/', {new_id: userId});
    obj.then(function (res){
      self.setState({favorites: res.data.user_favorites})
    }).catch(function(err){
      console.log(err);
    })
  }

  componentDidUpdate(prevProps){
    var currUrl = "/photos/" + this.props.match.params.userId;
    var url = "/photos/" + prevProps.match.params.userId;
    var self = this;
    if(currUrl !== url){
      var currObj = axios.get(currUrl);
      currObj.then(function (res){
        self.props.handler("Photos of " + res.data.first_name);
        self.setState({userProfile: res.data});
      }).catch(function(error){
          console.log(error);
      })
    }
  }


  getImages(){
    var images = [];
    for(let i = 0; i < this.state.userProfile.length;i++){
      images.push(this.state.userProfile[i]);
    }
    return images;
  }

  displayComments(photo){
    var comments = [];
    if(photo.comments !== undefined){
      for(let i = 0; i < photo.comments.length; i++){
        comments.push(<Link to={"/users/" + photo.comments[i].user._id} replace key={"link" +i}>{photo.comments[i].user.first_name+" "+photo.comments[i].user.last_name}</Link>);
        comments.push(<div key={i} className="comment">{photo.comments[i].comment}</div>);
        comments.push(<div key={"date"+i}>{photo.comments[i].date_time}</div>);
        if(this.props.curr_id == photo.comments[i].user._id){
          comments.push(<button onClick={()=> this.deleteComment(photo._id, photo.comments[i]._id)}>Delete Comment</button>)
        }
      }
    } else{
      comments.push(<div key="">No comments</div>);
    }
    return comments;
  }

  addButton(){
    var self = this
    var obj = axios.get('/user/' + this.props.curr_id);
    obj.then(function (res){
      self.setState({favorites: res.data.user_favorites});
    }, function (err) {
      console.log(err)
    })
  }

  likePhoto(photoid){
    var self = this;
    var obj2 = axios.post('/likePhotoUser/', {userid: this.props.curr_id, photoid: photoid})
    obj2.then(function(res){
      self.setState({user_likes: res.data[0], num_likes: res.data[1]})
      self.refresh()
    })
  }

  unlikePhoto(photoid){
    var self = this
    var obj = axios.post('/unlikePhotoUser/', {photoid: photoid, userid:this.props.curr_id})
    obj.then(function(res){
      self.setState({user_likes: res.data})
      self.refresh()
    })
  }

  removeFavorite(photoId){
    console.log("photoid is ", photoId)
    var self = this
    var obj = axios.post('/removeFromFavorites/', {id: photoId});
    obj.then(function (res){
      self.setState({favorites: res.data.user_favorites});
    }, function (err) {
      console.log(err)
    })
  }
  deletePhoto(photoid) {
    var self = this;
    var obj = axios.post('deletePhoto/'+photoid, {photoid: photoid});
    obj.then(function() {
      var curr = self.state.favorites;
      var index = curr.indexOf(photoid);
      if(index !== -1) {
        curr.splice(index,1);
      }
      var curr_pics = self.state.userProfile;
      var rem = null;
      curr_pics.map(function(res) {
        if(res._id === photoid) {
          rem = res;
        }
      });
      var index_2 = curr_pics.indexOf(rem);
      if(index_2 !== -1) {
        curr_pics.splice(index_2,1);
      }
      self.setState({
        photos: curr_pics,
        favoritedPhotos: curr
      });
    }, function() {
      console.log("error");
    });
  }

  deleteComment(photoid, commentid) {
    var self = this;
    var obj = axios.post('/deleteComment', {photoId: photoid, comment_id: commentid});
    obj.then(function() {
      self.refresh();
    }, function() {
      console.log("error");
    });
  }

  render() {
    var sorted_photos = this.state.userProfile.sort((a, b) => (a.date_time > b.date_time) ? -1 : 1).sort((c,d)=>(c.num_likes > d.num_likes) ? -1 : 1)
    return (
      <div>
        <div>
          {sorted_photos.map((photo) =>
            <div key={photo._id}>
              {console.log("photo is ", photo)}
              {photo.num_likes === undefined ?
                <div>0 likes</div>
                :
                <div>{photo.num_likes + " likes"}</div>
              }
              { !this.state.favorites.includes(photo._id) ? <button onClick={() => this.handleFavorites("/images/" + photo.file_name, photo._id)}> Add to Favorites </button>
                :
                 <button onClick={() => this.removeFavorite(photo._id)}>Remove From Favorites</button>
              }
              {!this.state.user_likes.includes(photo._id) ?
                <button onClick={() => this.likePhoto(photo._id)}>Like</button>
              :
                <button onClick={() => this.unlikePhoto(photo._id)}>Unlike</button>
              }
              {
                this.props.match.params.userId === this.props.curr_id ?
                  <button onClick={() => this.deletePhoto(photo._id)}> Delete Pic </button>
                  :
                <div/>
              }
              <img src={"/images/" + photo.file_name} className="image"/>
              <button key={photo._id+"1"} onClick= {() => this.onInputHandler(photo)} className="commentButton">Add Comment</button>
              <div className="comments" key="">
                {this.displayComments(photo)}
              </div>
            </div>)
          }
        </div>
      </div>
    );
  }
}

export default UserPhotos;
