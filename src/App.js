import "./App.css";
import { useEffect, useState } from "react";

const breakTimeFormat = Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
});
const stopwatchTimeFormat = Intl.DateTimeFormat(undefined, {
  timeZone: "UTC",
  timeStyle: "medium",
});

const BREAK = "break";
const SESSION = "session";

const Stopwatch = ({
  sessionTimeLimit,
  sessionNotificationInterval,
  breakLengthDivisor,
}) => {
  const [timeMs, setTimeMs] = useState(0);
  const [timeLimitMs, setTimeLimitMs] = useState(sessionTimeLimit);
  const [nextNotificationTime, setNextNotificationTime] = useState(
    sessionNotificationInterval,
  );
  const [mode, setMode] = useState(SESSION);
  const [timerWebWorker, _] = useState(
    new Worker(new URL("./timer.js", import.meta.url)),
  );

  useEffect(() => {
    timerWebWorker.onmessage = (e) => {
      console.log("received time: %d", e.data);
      setTimeMs(e.data);
    };
  }, []);

  const reachedTimeLimit = timeMs >= timeLimitMs;
  if (reachedTimeLimit) {
    if (mode === BREAK) {
      new Notification("Break ended, back to work!");
      timerWebWorker.postMessage("stop");
      initSession();
    } else {
      new Notification("Session limit reached, take a break!");
      initBreak();
    }
    timerWebWorker.postMessage("reset");
  } else if (nextNotificationTime && timeMs >= nextNotificationTime) {
    setNextNotificationTime(nextNotificationTime + sessionNotificationInterval);
    new Notification(
      `Still working? Session time: ${stopwatchTimeFormat.format(timeMs)}`,
    );
  }

  function initSession() {
    setTimeMs(0);
    setTimeLimitMs(sessionTimeLimit);
    setNextNotificationTime(sessionNotificationInterval);
    setMode(SESSION);
  }

  function initBreak() {
    const breakLength = timeMs / breakLengthDivisor;
    setTimeMs(0);
    setTimeLimitMs(breakLength);
    setNextNotificationTime(null);
    setMode(BREAK);
  }

  async function handleStart() {
    await Notification.requestPermission();
    timerWebWorker.postMessage("start");
  }

  function handleFinish() {
    if (mode === BREAK) {
      // maybe skip to next session feature
      return;
    }
    if (timeMs < 10000) {
      return;
    }
    timerWebWorker.postMessage("reset");
    initBreak();
  }

  return (
    <div>
      <h1>Pomodaptive</h1>
      <h2>
        {mode === SESSION
          ? stopwatchTimeFormat.format(timeMs)
          : stopwatchTimeFormat.format(timeLimitMs - timeMs)}
      </h2>
      <button onClick={handleStart}>Start Session</button>
      <button onClick={handleFinish}>Finish Session</button>
      {mode === BREAK && (
        <p>Break until: {breakTimeFormat.format(Date.now() + timeLimitMs)}</p>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Stopwatch
        sessionTimeLimit={1000 * 60 * 120}
        sessionNotificationInterval={1000 * 60 * 30}
        breakLengthDivisor={5}
      ></Stopwatch>
    </div>
  );
}

export default App;
