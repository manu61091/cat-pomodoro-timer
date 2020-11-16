<script>    
	import { fade,slide,scale } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import TimerStore from '../stores/TimerStore';

    const dispatch = createEventDispatcher();
    
    let fields = $TimerStore;
    let updatedFields = fields;
    let valid = true;
    
    const submitHandler = () =>{
        if (updatedFields.focusTime <= 0 | updatedFields.shortBreakTime <= 0 | updatedFields.longBreakTime <= 0 | updatedFields.sessionRounds <= 0){
            fields = {focusTime: 20, shortBreakTime: 5, longBreakTime: 25, sessionRounds: 4};
            TimerStore.update(fields =>{
                console.log(fields);
                return fields;
            });
            valid = false;
        }
        else{
            TimerStore.update(fields =>{
                return updatedFields;
            });
            dispatch('handleOptions');
        } 
        
    }
    </script>
    
    <form in:fade on:submit|preventDefault={submitHandler}>
        <div class="form-field">
            <label for="focus-time">Stay Focus Time</label>
            <input type="number" id="focus-time" min="1" bind:value={updatedFields.focusTime}>
        </div>
        <div class="form-field">
            <label for="short-break-time">Short Break Time</label>
            <input type="number" id="short-break-time" min="1" bind:value={updatedFields.shortBreakTime}>
        </div>
        <div class="form-field">
            <label for="long-break-time">Long Break Time</label>
            <input type="number" id="long-break-time" min="1" bind:value={updatedFields.longBreakTime}>
        </div>
        <div class="form-field">
            <label for="session-rounds">Session Rounds</label>
            <input type="number" id="session-rounds" min="1" bind:value={updatedFields.sessionRounds}>
        </div>
        {#if !valid}
        <p class="error">Zero or negative values not admitted</p>
        {/if}
        <button>Start</button>
        
    </form>
    
    <style>
        form{
            width:400px;
            margin: 0 auto;
            text-align: center;
            background: #f0f0f0;
            padding: 40px;
            border-radius: 10px;
        }
        .form-field{
            margin: 18px;
        }
        input{
            width: 100%;
            border-radius: 6px;
        }
        label{
            margin: 10px auto;
            text-align: center;
        }
        .error{
            color:crimson;
        }
      </style>