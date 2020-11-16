<script>
	import Header from './components/Header.svelte';
	import Footer from './components/Footer.svelte';
	import Tabs from './components/Tabs.svelte';
	import Timer from './components/Timer.svelte';
	import Options from './components/Options.svelte';
	import TimerStore from './stores/TimerStore.js';
	
	let tabs = ['Timer', 'Options'];
	let activeTab = 'Options';

	const changeTab = (e) => {
		activeTab = e.detail;
	}

	const handleOptions = () => {
		activeTab = 'Timer'
	}

</script>

<Header />

<body>
	<Tabs {tabs} {activeTab} on:changeTab={changeTab}/> 
	{#if activeTab === 'Timer'}
	<Timer />
	{:else if activeTab === 'Options'}
	<Options on:handleOptions={handleOptions}/>
	{/if}
  
</body>

<Footer />



<style>

</style>
