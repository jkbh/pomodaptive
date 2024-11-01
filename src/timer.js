let timer = 0;
let interval;

function startTimer() {
  if (interval) return;
  interval = setInterval(() => {
    timer += 1000;
    postMessage(timer);
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
  interval = null;
}

function resetTimer() {
  timer = 0;
  postMessage(timer);
}

onmessage = (e) => {
  switch (e.data) {
    case "start":
      startTimer();
      break;
    case "reset":
      resetTimer();
      break;
    case "stop":
      stopTimer();
      break;
    default:
      console.log("web worker received unknown message");
      break;
  }
};
