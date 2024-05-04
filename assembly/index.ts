// The entry file of your WebAssembly module.

export function negative(byteSize: i32): i32 {
  for (let i = 0; i < byteSize; i += 4) {
    let pos = i + byteSize;
    store<u8>(pos + 0, 255 - load<u8>(i + 0));
    store<u8>(pos + 1, 255 - load<u8>(i + 1));
    store<u8>(pos + 2, 255 - load<u8>(i + 2));
    store<u8>(pos + 3, 255);
  }
  return 0;
}

export function grayscale(byteSize: i32): i32 {
  for (let i = 0; i < byteSize; i += 4) {
    let pos = i + byteSize;
    const avg = u8(0.3 * load<u8>(i) + 0.59 * load<u8>(i + 1) + 0.11 * load<u8>(i + 2));
    store<u8>(pos + 0, avg);
    store<u8>(pos + 1, avg);
    store<u8>(pos + 2, avg);
    store<u8>(pos + 3, 255);
  }
  return 0;
}

function _getPixelChannelValue(width: i32, x: i32, y: i32, channel: i32): i32 {
  const offset = channel;
  const chosenIndex = ((x % width) + width * y) * 4;
  const chosenValue = load<u8>(chosenIndex + offset);
  return chosenValue;
}

export function _getPixelCyclic(width: i32, height: i32, x: i32, y: i32): Array<i32> {
  let newX: i32 = 0;
  let newY: i32 = 0;

  if (x < 0) {
    newX = height + (x % height);
  } else if (x >= height) {
    newX = x % height;
  } else {
    newX = x;
  }

  if (y < 0) {
    newY = width + (y % width);
  } else if (y >= width) {
    newY = y % width;
  } else {
    newY = y;
  }

  return [newX, newY];
}

export function _getPixelNull(width: i32, height: i32, x: i32, y: i32): Array<i32> {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return [-10000, -10000];
  }

  return [x, y];
}

export function _getPixelRepeat(width: i32, height: i32, x: i32, y: i32): Array<i32> {
  const newX: i32 = i32(Math.max(0, Math.min(width - 1, x)));
  const newY: i32 = i32(Math.max(0, Math.min(height - 1, y)));

  return [newX, newY];
}

export function getPixelByMode(width: i32, height: i32, x: i32, y: i32, mode: i32): Array<i32> {
  switch (mode) {
    case 0:
      return _getPixelCyclic(width, height, x, y);
    case 1:
      return _getPixelNull(width, height, x, y);
    case 2:
      return _getPixelRepeat(width, height, x, y);
    default:
      return _getPixelCyclic(width, height, x, y);
  }
}


@inline
function addConvolveValue(pos: i32, oldValue: u8, length: i32, w: i32, mode: i32): i32 {
  return i32(pos >= 0) & i32(pos < length) ? load<u8>(pos) : oldValue;
}

export function convolve(
  byteSize: i32,
  w: i32,
  offset: i32,
  mode: i32,
  v00: i32,
  v01: i32,
  v02: i32,
  v10: i32,
  v11: i32,
  v12: i32,
  v20: i32,
  v21: i32,
  v22: i32,
): i32 {
  let divisor = v00 + v01 + v02 + v10 + v11 + v12 + v20 + v21 + v22 || 1;
  for (let i = 0; i < byteSize; i++) {
    if (((i + 1) & 3) == 0) {
      store<u8>(i + byteSize, load<u8>(i));
      continue;
    }
    let stride = w * 4;
    let prev = i - stride;
    let next = i + stride;
    let oldValue = load<u8>(i);
    let res =
      v00 * addConvolveValue(prev - 4, oldValue, byteSize, w, mode) +
      v01 * addConvolveValue(prev, oldValue, byteSize, w, mode) +
      v02 * addConvolveValue(prev + 4, oldValue, byteSize, w, mode) +
      v10 * addConvolveValue(i - 4, oldValue, byteSize, w, mode) +
      v11 * oldValue +
      v12 * addConvolveValue(i + 4, oldValue, byteSize, w, mode) +
      v20 * addConvolveValue(next - 4, oldValue, byteSize, w, mode) +
      v21 * addConvolveValue(next, oldValue, byteSize, w, mode) +
      v22 * addConvolveValue(next + 4, oldValue, byteSize, w, mode);
    res /= divisor;
    res += offset;
    store<u8>(i + byteSize, u8(res));
  }
  return 0;
}
