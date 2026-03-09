let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

function emitWorldEvent(eventName, payload) {
  if (!ioInstance) return;
  ioInstance.emit(eventName, payload);
}

module.exports = {
  setIO,
  getIO,
  emitWorldEvent
};
