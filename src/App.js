import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import convnetjs from 'convnetjs';

let INSTABILITY_MULTIPLIER = 0.001;
let STEERING_MULTIPLIER = 0.04;

class App extends Component {
  constructor(props) {
    super(props);

    this._pressedDirection = 0;
    this._instabilityDirection = 0;
    this.calculatePosition = this.calculatePosition.bind(this)

    this.state = {
      isHumanInput: true,
      position: Math.random()
    };

    this.createNetwork();
  }

  calculatePosition() {
    this.setState((prevState) => {

      let correctionDirection = 0; // -1 for left, +1 for right

      // calculate AI output if not human
      let guessedDirectionName = '.';
      let x = new convnetjs.Vol([prevState.position]);
      let probabilityVolume = this._net.forward(x);
      let probableClassIndex = this.highestIndex(probabilityVolume.w);
      if (probableClassIndex === 0) {
        guessedDirectionName = 'left'
      } else if (probableClassIndex === 2) {
        guessedDirectionName = 'right'
      }

      // decide correction based on who is in control
      if (!this.state.isHumanInput) {
        if (probableClassIndex === 0) {
          correctionDirection = -1;
        } else if (probableClassIndex === 2) {
          correctionDirection = 1;
        }
      } else {
        correctionDirection = this._pressedDirection;
      }
      
      // random noise
      let tweak = (Math.random() - 0.5) * INSTABILITY_MULTIPLIER;
      this._instabilityDirection += tweak;

      // correction value - either human or AI
      let correctionDistance = (correctionDirection * STEERING_MULTIPLIER);

      // train AI model if human input
      if (this.state.isHumanInput) {
        this._trainer.train(x, (this._pressedDirection + 1) / 2);
        console.log([prevState.position, (this._pressedDirection + 1)/2])        
      }

      // calculate new final position for display
      let lastPosition = prevState.position;
      let newPosition = lastPosition + this._instabilityDirection + correctionDistance;

      // add bounds for possible position values
      if ((newPosition < 0) || (newPosition > 1)) {
        this._instabilityDirection = 0;
        newPosition = lastPosition
      }

      return {
       position: newPosition,
       guessedDirectionName: guessedDirectionName,
      }
    }, () => {
      requestAnimationFrame(this.calculatePosition)
    });
  }

  componentDidMount() {
    requestAnimationFrame(this.calculatePosition)
    document.addEventListener('keydown', (e) => {
      if (e.keyIdentifier === 'Left') {
        this._pressedDirection = -1;
      } else if (e.keyIdentifier === 'Right') {
        this._pressedDirection = 1;
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.keyIdentifier === 'Left') {
        this._pressedDirection = 0;
      } else if (e.keyIdentifier === 'Right') {
        this._pressedDirection = 0;
      }
    });
  }

  createNetwork() {
    var layer_defs = [];
    
    // input layer of size 1x1x2 (all volumes are 3D)
    layer_defs.push({type:'input', out_sx:1, out_sy:0, out_depth:2});
    
    // some fully connected layers
    layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
    layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});

    // a softmax classifier predicting probabilities for two classes: 0,1
    layer_defs.push({type:'softmax', num_classes:3});
     
    // create a net out of it
    var net = new convnetjs.Net();
    net.makeLayers(layer_defs);

    var trainer = new convnetjs.Trainer(net, {learning_rate:0.01, l2_decay:0.001});

    this._net = net;
    this._trainer = trainer;
  }

  highestIndex(arr) {
    let highestValue = 0;
    let highestIndex;

    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > highestValue) {
        highestValue = arr[i];
        highestIndex = i;
      }
    }

    return highestIndex;
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to School</h2>
        </div>
        <p className="App-intro">
          To get started, try keeping the dot in the center with your arrow keys.
        </p>
        <p>{this.state.guessedDirectionName}</p>
        <div
          style={{
            margin: 'auto',
            width: 300,
            height: 30,
            borderWidth: 1,
            borderColor: 'black',
            borderStyle: 'solid',
          }}
        >
        <div
          style={{
            marginLeft: ((300-10) * this.state.position),
            width: 10,
            height: 30,
            backgroundColor: 'black',
          }}
        />
        </div>
      </div>
    );
  }
}

export default App;
