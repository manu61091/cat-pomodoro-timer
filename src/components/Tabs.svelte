<script>
    import { createEventDispatcher } from 'svelte';

    let dispatch = createEventDispatcher();

    export let tabs;
    export let activeTab;


</script>

<ul>
    {#each tabs as tab}
    <li on:click={() => dispatch('changeTab',tab)}>
    <div class:active={tab === activeTab}>{tab}</div>
    </li>
    {/each}    
</ul>

<style>
    ul{
        display: flex;
        justify-content: center;
        list-style-type: none;
        border: 0;
        padding: 30px;
    }
    li{
        padding: 0 15px;
        cursor: pointer;
        font-size: 20px;
        text-shadow: black 1px;
    }
    .active{
        border-bottom: 3px solid gray;

    }
</style>