import React from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './UserFavorites.css';
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

class UserFavorites extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      val: '', password: '', data: [], modalIsOpen: false, curr_photo: ''
    };
    this.getImages = this.getImages.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.removePic = this.removePic.bind(this);

  }

  componentWillMount() {
    Modal.setAppElement('body');
  }

  componentDidMount(){
    this.getImages();
  }

  goBack(){
    console.log("id is", this.props.userId)
    window.location='http://localhost:3000/photo-share.html#/photos/' + this.props.userId;
  }

  getImages(){
    var self = this
    var obj = axios.get('/photosOf/favorites');
    obj.then(function (res){
      console.log("RES IS ", res.data)
      self.setState({data: res.data});
    }, function (err) {
      console.log(err)
    })
  }

  openModal(photo) {
    this.setState({modalIsOpen: true, curr_photo: photo});
  }


  closeModal() {
    this.setState({modalIsOpen: false});
  }

  removePic(photoId){
    console.log("photoid is ", photoId)
    var self = this
    var obj = axios.post('/removeFromFavorites/', {id: photoId});
    obj.then(function (res){
      self.setState({favorites: res.data.user_favorites});
      self.getImages();
    }, function (err) {
      console.log(err)
    })
  }

  render() {
    return (
      <div>
        <button className="return" onClick= {() => this.goBack()}>Return To Photos</button>
        {this.state.data.map((photo) =>
          <div key={photo._id}>
            <button onClick={() => this.openModal(photo)}><img src={"/images/" + photo.file_name} className="image"/></button>
            <div>
              <button onClick={() => this.removePic(photo._id)}>Remove</button>
              <Modal
                isOpen={this.state.modalIsOpen}
                onAfterOpen={this.afterOpenModal}
                onRequestClose={this.closeModal}
                contentLabel="Example Modal"
                style={customStyles}
              >
              <div>
                <button onClick={this.closeModal}>close</button>
              </div>
              <div>
                <img src={"/images/" + this.state.curr_photo.file_name} className="image"/>
                <div>{"This photo was uploaded on "+this.state.curr_photo.date_time}</div>
              </div>
            </Modal>
          </div>
          </div>)}
      </div>
    );
  }
}

export default UserFavorites;
