import {CORRECTIONSENUM} from "./constants.js"

export default class Filter {
    constructor(mainCanvas, context) {
      this.mainCanvas = mainCanvas;
      this.ctx = context;
      this.corrections = {
        brightness: 0,
        contrast: 0,
        gamma: 0,
      }
    }
  
    grayscale() {
      if(this.mainCanvas.isGrayscale === true) {
        this.applyFilterToCurrentCanvas(this.mainCanvas.originalImageData);
        this.mainCanvas.isGrayscale = false;
        return

      }
      const { tempImageData, data, tempData } = this.generateImageData();
  
      for (let i = 0; i < data.length; i += 4) {
        const grayscaleValue = 0.299 * data[i] +  0.587 * data[i + 1] + 0.114 * data[i + 2];
        tempData[i] = grayscaleValue;          // Red component
        tempData[i + 1] = grayscaleValue;  // Green component
        tempData[i + 2] = grayscaleValue;  // Blue component
        tempData[i + 3] = data[i + 3];        // Alpha component
      }
      this.applyFilterToCurrentCanvas(tempImageData);
      this.mainCanvas.isGrayscale = true;
    }
  
    negative() {
      const { tempImageData, data, tempData } = this.generateImageData();
  
      for (let i = 0; i < data.length; i += 4) {
        tempData[i] = 255 - data[i];          // Red component
        tempData[i + 1] = 255 - data[i + 1];  // Green component
        tempData[i + 2] = 255 - data[i + 2];  // Blue component
        tempData[i + 3] = data[i + 3];        // Alpha component
      }
      
      this.applyFilterToCurrentCanvas(tempImageData);
    }
  
    applyCorrections() {
      const originalImageData = this.mainCanvas.originalImageData.data;
      const { tempImageData, data, tempData } = this.generateImageData();
      
      const lookUpTable = this.createLookUpTable(this.corrections);
  
      for (let i = 0; i < data.length; i += 4) {
        tempData[i] = lookUpTable[originalImageData[i]];           // Red component
        tempData[i + 1] = lookUpTable[originalImageData[i + 1]];   // Green component
        tempData[i + 2] = lookUpTable[originalImageData[i + 2]];   // Blue component
        tempData[i + 3] = lookUpTable[originalImageData[i + 3]];   // Alpha component
      }
      
      this.applyFilterToCurrentCanvas(tempImageData);
    }
  
    applyFilterToCurrentCanvas(newImageData) {
      this.ctx.putImageData(newImageData, 0, 0);
    }
  
    createLookUpTable(values) {
      console.log('values', values)
      const lookUpTable = new Uint8ClampedArray(Array.from({ length: 256 }, (_, index) => index));
      console.log('lookUpTable', lookUpTable)
      let modifiedLookUpTable = [];
  
      for (const [operation, value] of Object.entries(values)) {
        console.log(`${operation}: ${value}`);
        if(value === 0) continue;
        switch (operation) {
          case CORRECTIONSENUM.brightness:
            if(modifiedLookUpTable.length === 0){
              modifiedLookUpTable = lookUpTable.map(lookUpTableValue => {
                const newValue = lookUpTableValue + value;
                return newValue
              });
            } else {
              modifiedLookUpTable = modifiedLookUpTable.map(lookUpTableValue => {
                const newValue = lookUpTableValue + value;
                return newValue
              });
            }
            break;
          case CORRECTIONSENUM.contrast:
            if(modifiedLookUpTable.length === 0){
              modifiedLookUpTable = lookUpTable.map(lookUpTableValue => {
                const newValue = lookUpTableValue * (value);
                return newValue
              });
            } else {
              modifiedLookUpTable = modifiedLookUpTable.map(lookUpTableValue => {
                const newValue = lookUpTableValue * (value);
                return newValue
              });
            }
            break;
          case CORRECTIONSENUM.gamma:
            if(modifiedLookUpTable.length === 0){
              modifiedLookUpTable = lookUpTable.map(lookUpTableValue => {
                const newValue = Math.pow(lookUpTableValue, value);
                console.log('newValue', newValue)
                return newValue
              });
            } else {
              modifiedLookUpTable = modifiedLookUpTable.map(lookUpTableValue => {
                const newValue = Math.pow(lookUpTableValue, value);
                console.log('newValue', newValue)
                return newValue
              });
            }
            break;
              
          default:
            break;
        }
      }
      console.log('modifiedLookUpTable', modifiedLookUpTable)
      return modifiedLookUpTable.map(x => parseInt(x))
    }
  
    generateImageData() {
      const imageData = this.ctx.getImageData(0, 0, this.mainCanvas.getCanvas().width, this.mainCanvas.getCanvas().height);
      const tempImageData = new ImageData(this.mainCanvas.getCanvas().width, this.mainCanvas.getCanvas().height);
      const data = imageData.data;
      const tempData = tempImageData.data;
  
      return {tempImageData, data, tempData}
    }
  }

  //TODO add some logic into applying filters and corrections