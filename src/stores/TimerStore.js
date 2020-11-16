import { writable } from 'svelte/store';

const TimerStore = writable(
    {
      focusTime:20,
      shortBreakTime:5,
      longBreakTime:25,
      sessionRounds:4,
    },
  );


  export default TimerStore;