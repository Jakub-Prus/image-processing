export default class Transformations {
    constructor(mainCanvas, histogram) {
        this.mainCanvas = mainCanvas;
        this.ctx = mainCanvas.ctx;
        this.histogram = histogram;
    }

    histogramStreching() {
      const isGrayscale = this.mainCanvas.isGrayscale;
      const currentImageData = this.mainCanvas.getImageData();
      const stretchedImgData = new ImageData(this.mainCanvas.canvas.width, this.mainCanvas.canvas.height);
      console.log('isGrayscale', isGrayscale)
      if(isGrayscale){
        const edges = this._findEdgesOfChannel(this.histogram.A)
        for (let i = 0; i < currentImageData.data.length; i += 4) {
          stretchedImgData.data[i] = (255 / (edges.max - edges.min)) * (currentImageData.data[i] - edges.min);             // Red component
          stretchedImgData.data[i + 1] = (255 / (edges.max - edges.min)) * (currentImageData.data[i + 1] - edges.min);     // Green component
          stretchedImgData.data[i + 2] = (255 / (edges.max - edges.min)) * (currentImageData.data[i + 2] - edges.min);     // Blue component
          stretchedImgData.data[i + 3] = (255 / (edges.max - edges.min)) * (currentImageData.data[i + 3] - edges.min);     // Alpha component
        }
      } else {
        const edgesR = this._findEdgesOfChannel(this.histogram.R)
        const edgesG = this._findEdgesOfChannel(this.histogram.G)
        const edgesB = this._findEdgesOfChannel(this.histogram.B)
        const edgesA = this._findEdgesOfChannel(this.histogram.A)
        
        for (let i = 0; i < currentImageData.data.length; i += 4) {
          stretchedImgData.data[i] = (255 / (edgesR.max - edgesR.min)) * (currentImageData.data[i] - edgesR.min);             // Red component
          stretchedImgData.data[i + 1] = (255 / (edgesG.max - edgesG.min)) * (currentImageData.data[i + 1] - edgesG.min);     // Green component
          stretchedImgData.data[i + 2] = (255 / (edgesB.max - edgesB.min)) * (currentImageData.data[i + 2] - edgesB.min);     // Blue component
          stretchedImgData.data[i + 3] = (255 / (edgesA.max - edgesA.min)) * (currentImageData.data[i + 3] - edgesA.min);     // Alpha component
        }
      }
      console.log('histogramStreching');
      console.log('stretchedImgData', stretchedImgData)
      console.log('currentImageData', currentImageData)
      this.mainCanvas.applyImageDataToCurrentCanvas(stretchedImgData);
      this.histogram.update()
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


    histogramEqualization() {
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
      this.histogram.update()
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