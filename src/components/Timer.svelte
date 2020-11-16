<script>
    import { fade,slide,scale } from 'svelte/transition';
    import TimerStore from '../stores/TimerStore.js';

    let timerParameters = $TimerStore;

    const minutesToSeconds = (minutes) => minutes * 60;
    const secondsToMinutes = (seconds) => Math.floor(seconds / 60);
    const padWithZeroes = (number) => number.toString().padStart(2, '0');
    const State = {idle: 'idle', inProgress: 'in progress', resting: 'resting'};
  
    const POMODORO_S = minutesToSeconds(timerParameters.focusTime);
    const LONG_BREAK_S = minutesToSeconds(timerParameters.longBreakTime);
    const SHORT_BREAK_S = minutesToSeconds(timerParameters.shortBreakTime);
  
    let currentState = State.idle;
    let pomodoroTime = POMODORO_S;
    let completedPomodoros = 0;
    let interval;
    let paused = false;
    let message = 'READY TO START'
    let tasks = 0;
  
    function formatTime(timeInSeconds) { 
      const minutes = secondsToMinutes(timeInSeconds);
      const remainingSeconds = timeInSeconds % 60;
      return `${padWithZeroes(minutes)}:${padWithZeroes(remainingSeconds)}`;
    }
  
    function startPomodoro() { 
      setState(State.inProgress);
      message = 'STAY FOCUSED';
      interval = setInterval(() => {
        if (pomodoroTime === 0) {
          completePomodoro();
        }
        if (paused){
        pomodoroTime -= 0;
        }
        else{
        pomodoroTime -= 1;

        }
      },1000);
    }
  
    function setState(newState){
      clearInterval(interval)
      currentState = newState;
    }
  
    function completePomodoro(){
      completedPomodoros++;
      if (completedPomodoros === timerParameters.sessionRounds) {
        message = 'TIME TO TAKE A LONG BREAK'  
        tasks++;
        rest(LONG_BREAK_S);
        completedPomodoros = 0;
      } else {
        message = 'TIME TO TAKE A SHORT BREAK'  
        rest(SHORT_BREAK_S);
      }
    }
  
    function rest(time){
      setState(State.resting);
      pomodoroTime = time;
      interval = setInterval(() => {
        if (pomodoroTime === 0) {
          idle();
        }
        if (paused){
        pomodoroTime -= 0;
        }
        else{
        pomodoroTime -= 1;

        }
      },1000);
    }
  
    function cancelPomodoro() {
      // TODO: Add some logic to prompt the user to write down
      // the cause of the interruption.
      idle();
    }
  
    function idle(){
      setState(State.idle);
      pomodoroTime = POMODORO_S;
    }

    function nextRound(){
        if (currentState === State.inProgress){
            completePomodoro();
        }
        else if (currentState === State.resting){
            message = 'READY TO START'
            idle();
        }
    }

  
  </script>
  
  <div class="timer" in:fade>
    <time>
      {formatTime(pomodoroTime)}
    </time>
    <p class="message">{message}</p>
    <div class="control-timer"> 
      <button class="primary" on:click={startPomodoro} disabled={currentState !== State.idle}>Start</button>
      <button on:click={cancelPomodoro} disabled={currentState !== State.inProgress}>Stop</button>
      <button on:click={() => {paused = true}} disabled={currentState !== State.inProgress | paused}>Pause</button>
      <button on:click={() => {paused = false}} disabled={currentState !== State.inProgress | !paused}>Resume</button>
    </div>
    <div class="control-timer-2">
        <button on:click={nextRound}>Next Round</button>
    </div>
    <div>
        <h3>Sessions:</h3>
        <h3>{completedPomodoros}/{timerParameters.sessionRounds}</h3>
        <h3>Tasks completed</h3>
        <h3>{tasks}</h3>
    </div>
  </div>

  <style>
        .timer{
        background: #f0f0f0;
        display: block;
        text-align: center;
      }
    time {
      display: flex;
      justify-content: center;
      font-size: 5em;
      margin-bottom: 0.2em;
      padding: 30px;
    }
    button{
        border: 1px solid black;
      cursor: pointer;
      border-radius: 6px;
      padding: 8px 12px;
      font-weight: bold;
      box-shadow: 1px 2px 3px rgba(0,0,0,0.2);
    }
    .control-timer{
      display: flex;
      justify-content: center;
      padding: 40px;
      gap: 10px;
    }
    .message{
      display: inline;
      border-radius: 13px;
      font-weight: bolder;
      font-size: 20px;
      color: rgb(94, 94, 94);
    }
  </style>
  