export default class Histogram {
  constructor(mainCanvas, ctx) {
      this.mainCanvas = mainCanvas;
      this.ctx = ctx;
      this.A = new Array(256).fill(0);
      this.R = new Array(256).fill(0);
      this.G = new Array(256).fill(0);
      this.B = new Array(256).fill(0);
      this.avoidedChannels = []
  }

  update(avoidedChannel = []) {
    this.avoidedChannels = avoidedChannel;
    this.generate(this.mainCanvas.getImageData(), this.mainCanvas.isGrayscale);
  }

  generate(imgData, isGrayscale) {
  const src = new Uint32Array(imgData.data.buffer);

  this.A.fill(0);
  this.R.fill(0);
  this.G.fill(0);
  this.B.fill(0);
  
  
  for (let i = 0; i < src.length; i++) {
    let r = src[i] & 0xFF;
    let g = src[i] >> 8 & 0xFF;
    let b = src[i] >> 16 & 0xFF;
    if (!this.avoidedChannels.includes('R')) this.R[r]++;
    if (!this.avoidedChannels.includes('G')) this.G[g]++;
    if (!this.avoidedChannels.includes('B')) this.B[b]++;
    if (!this.avoidedChannels.includes('L')) {
      this.A[r]++;
      this.A[g]++;
      this.A[b]++;
    }
  }
  
  let maxBrightness = 0;
  if (isGrayscale) {
      for (let i = 1; i < 256; i++) {
      if (maxBrightness < this.A[i]) {
          maxBrightness = this.A[i];
      }
      }
  } else {
    for (let i = 0; i < 256; i++) {
      if (maxBrightness < this.R[i]) {
        maxBrightness = this.R[i];
      } else if (maxBrightness < this.G[i]) {
        maxBrightness = this.G[i];
      } else if (maxBrightness < this.B[i]) {
        maxBrightness = this.B[i];
      }
    }
  }
  
  const canvas = document.getElementById('canvasHistogram');
  const ctx = canvas.getContext('2d');
  let guideHeight = 8;
  let startY = canvas.height - guideHeight;
  let dx = canvas.width / 256;
  let dy = startY / maxBrightness;
  ctx.lineWidth = dx;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < 256; i++) {
      let x = i * dx;
      if (isGrayscale) {
      // Value
      ctx.strokeStyle = "#000000";
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY - this.A[i] * dy);
      ctx.closePath();
      ctx.stroke();
      } else {
      // Red
      ctx.strokeStyle = "rgba(220,0,0,0.5)";
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY - this.R[i] * dy);
      ctx.closePath();
      ctx.stroke();
      // Green
      ctx.strokeStyle = "rgba(0,210,0,0.5)";
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY - this.G[i] * dy);
      ctx.closePath();
      ctx.stroke();
      // Blue
      ctx.strokeStyle = "rgba(0,0,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY - this.B[i] * dy);
      ctx.closePath();
      ctx.stroke();
      }
      // Guide
      ctx.strokeStyle = 'rgb(' + i + ', ' + i + ', ' + i + ')';
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, canvas.height);
      ctx.closePath();
      ctx.stroke();
    }
  }

  stretching() {
    const isGrayscale = this.mainCanvas.isGrayscale;
    const currentImageData = this.ctx.getImageData(0, 0, this.mainCanvas.canvas.width, this.mainCanvas.canvas.height);
    const stretchedImgData = new ImageData(this.mainCanvas.canvas.width, this.mainCanvas.canvas.height);

    if(isGrayscale){
      const edges = this._findEdgesOfChannel(this.A)
      for (let i = 0; i < currentImageData.data.length; i += 4) {
        stretchedImgData.data[i] = (255 / (edges.max - edges.min)) * (currentImageData.data[i] - edges.min);             // Red component
        stretchedImgData.data[i + 1] = (255 / (edges.max - edges.min)) * (currentImageData.data[i + 1] - edges.min);     // Green component
        stretchedImgData.data[i + 2] = (255 / (edges.max - edges.min)) * (currentImageData.data[i + 2] - edges.min);     // Blue component
        stretchedImgData.data[i + 3] = (255 / (edges.max - edges.min)) * (currentImageData.data[i + 3] - edges.min);     // Alpha component
      }
    } else {
      const edgesR = this._findEdgesOfChannel(this.R)
      const edgesG = this._findEdgesOfChannel(this.G)
      const edgesB = this._findEdgesOfChannel(this.B)
      const edgesA = this._findEdgesOfChannel(this.A)

      for (let i = 0; i < currentImageData.data.length; i += 4) {
        stretchedImgData.data[i] = (255 / (edgesR.max - edgesR.min)) * (currentImageData.data[i] - edgesR.min);             // Red component
        stretchedImgData.data[i + 1] = (255 / (edgesG.max - edgesG.min)) * (currentImageData.data[i + 1] - edgesG.min);     // Green component
        stretchedImgData.data[i + 2] = (255 / (edgesB.max - edgesB.min)) * (currentImageData.data[i + 2] - edgesB.min);     // Blue component
        stretchedImgData.data[i + 3] = (255 / (edgesA.max - edgesA.min)) * (currentImageData.data[i + 3] - edgesA.min);     // Alpha component
      }
    }
    this.mainCanvas.applyImageDataToCurrentCanvas(stretchedImgData);
    this.update()
}

  _findEdgesOfChannel(channel) {
    let min = 0;
    let max = 255;
    for (let i = 0; i < 256; i++) {
        if (channel[i] !== 0) {
            min = i;
            break;
        }
    }
    for (let i = 255; i >= 0; i--) {
        if (channel[i] !== 0) {
            max = i;
            break;
        }
    }

    return {min, max}
  }

  equalization() {
    const isGrayscale = this.mainCanvas.isGrayscale;
    const currentImageData = this.ctx.getImageData(0, 0, this.mainCanvas.canvas.width, this.mainCanvas.canvas.height);
    const equalizationImgData = new ImageData(this.mainCanvas.canvas.width, this.mainCanvas.canvas.height);

    if(isGrayscale){
      const propabilityOfPixelsScaledL = this._calculatePropabilityOfPixelsGrayscale(currentImageData.data);

      const distributor = new Array(256).fill(0);
      for (let i = 0; i < propabilityOfPixelsScaledL.length; i++) {
        for (let j = 0; j <= i; j++) {
          distributor[i] += propabilityOfPixelsScaledL[j];
        }
      }

      const distributorScaled = this._scaleNumbersToRange(distributor);
      const distributorScaledNormalized = distributorScaled.map(value => parseInt(value))

      for (let i = 0; i < currentImageData.data.length; i += 4) {
        equalizationImgData.data[i + 0] = distributorScaledNormalized[currentImageData.data[i + 0]];    // Red component
        equalizationImgData.data[i + 1] = distributorScaledNormalized[currentImageData.data[i + 1]];    // Green component
        equalizationImgData.data[i + 2] = distributorScaledNormalized[currentImageData.data[i + 2]];    // Blue component
        equalizationImgData.data[i + 3] = distributorScaledNormalized[currentImageData.data[i + 3]];    // Alpha component
      }

    } else {
      const propabilityTable = this._calculatePropabilityOfPixelsColor(currentImageData.data);

      const distributor = {
        R: new Array(256).fill(0),
        G: new Array(256).fill(0),
        B: new Array(256).fill(0),
        A: new Array(256).fill(0),
      };

      for (let i = 0; i < propabilityTable.R.length; i++) {
        for (let j = 0; j <= i; j++) {
          distributor.R[i] += propabilityTable.R[j];
          distributor.G[i] += propabilityTable.G[j];
          distributor.B[i] += propabilityTable.B[j];
          distributor.A[i] += propabilityTable.A[j];
        }
      }

      const distributorScaled = {
        R: this._scaleNumbersToRange(distributor.R),
        G: this._scaleNumbersToRange(distributor.G),
        B: this._scaleNumbersToRange(distributor.B),
        A: this._scaleNumbersToRange(distributor.A),
      };

      const distributorScaledNormalized = {
        R: distributorScaled.R.map(value => parseInt(value)),
        G: distributorScaled.G.map(value => parseInt(value)),
        B: distributorScaled.B.map(value => parseInt(value)),
        A: distributorScaled.A.map(value => parseInt(value)),
      };

      for (let i = 0; i < currentImageData.data.length; i += 4) {
        equalizationImgData.data[i + 0] = distributorScaledNormalized.R[currentImageData.data[i + 0]];    // Red component
        equalizationImgData.data[i + 1] = distributorScaledNormalized.G[currentImageData.data[i + 1]];    // Green component
        equalizationImgData.data[i + 2] = distributorScaledNormalized.B[currentImageData.data[i + 2]];    // Blue component
        equalizationImgData.data[i + 3] = distributorScaledNormalized.A[currentImageData.data[i + 3]];    // Alpha component
      }
    }
    
    this.mainCanvas.applyImageDataToCurrentCanvas(equalizationImgData);
    this.update()
  }

  _calculatePropabilityOfPixelsColor(imageDataData) {
    let R = new Array(256).fill(0);
    let G = new Array(256).fill(0);
    let B = new Array(256).fill(0);
    let A = new Array(256).fill(0);

    for (let i = 0; i < imageDataData.length; i += 4) {
      R[imageDataData[i]]++;
      G[imageDataData[i + 1]]++;
      B[imageDataData[i + 2]]++;
      A[imageDataData[i + 3]]++;
    }

    return {R, G, B, A}
  }

  _calculatePropabilityOfPixelsGrayscale(imageDataData) {
    let propabilityTableL = new Array(256).fill(0);

    for (let i = 0; i < imageDataData.length; i += 4) {
      propabilityTableL[imageDataData[i]]++;
    }

    return propabilityTableL
  }

  _scaleNumbersToRange(numbers, minRange = 0, maxRange = 255) {
    const minNumber = Math.min(...numbers);
    const maxNumber = Math.max(...numbers);

    const scaledNumbers = numbers.map(number => {
        return minRange + (number - minNumber) * (maxRange - minRange) / (maxNumber - minNumber);
    });

    return scaledNumbers;
  } 


}


