import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import convnetjs from 'convnetjs';

let SIZE = 3;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dots: this.generateDots()
    };
    this.createNetwork();
  }

  generateDots() {
    let colors = [];
    for (var i = 0; i < SIZE; i++) {
      colors.push(Math.random());
    }
    return colors
  }

  createNetwork() {
    var layer_defs = [];
    
    // input layer of size 1x1xSIZE (all volumes are 3D)
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:SIZE});
    
    // some fully connected layers
    layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
    // layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});

    // a softmax classifier predicting probabilities for two classes: 0,1
    layer_defs.push({type:'softmax', num_classes:SIZE});
     
    // create a net out of it
    var net = new convnetjs.Net();
    net.makeLayers(layer_defs);

    var trainer = new convnetjs.Trainer(net, {learning_rate:0.01, l2_decay:0.001});

    this._net = net;
    this._trainer = trainer;
  }

  dotClicked(index) {
    // the network always works on Vol() elements. These are essentially
    // simple wrappers around lists, but also contain gradients and dimensions
    // line below will create a 1x1xSIZE volume and fill it
    var x = new convnetjs.Vol(this.state.dots);
    this._trainer.train(x, index);
    this.setState({
      dots: this.generateDots()
    })
  }

  highestIndex(arr) {
    let highestValue = 0;
    let highestIndex;

    console.log(arr);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > highestValue) {
        highestValue = arr[i];
        highestIndex = i;
      }
    }

    return highestIndex;
  }

  render() {
     
    var x = new convnetjs.Vol(this.state.dots);
    var probability_volume = this._net.forward(x);
    let probableIndex = this.highestIndex(probability_volume.w);
    
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to School</h2>
        </div>
        <p className="App-intro">
          To get started, select the darkest cell.
        </p>
        {this.state.dots.map((dot, index) => {
          let color = Math.round(dot * 255);
          return (
            <div 
              key={index}
              onClick={()=>this.dotClicked(index)}
              style={{
                display: 'inline-block',
                backgroundColor: 'rgb('+color+','+color+','+color+')',
                width: 30,
                height: 30,
                borderWidth: 2,
                borderColor: (probableIndex === index) ? 'red' : 'grey',
                borderStyle: 'solid',
                margin: 2,
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>
    );
  }
}

export default App;
