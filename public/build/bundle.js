
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Header.svelte generated by Svelte v3.29.7 */

    const file = "src/components/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h10;
    	let img;
    	let img_src_value;
    	let t0;
    	let h11;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h10 = element("h1");
    			img = element("img");
    			t0 = space();
    			h11 = element("h1");
    			h11.textContent = "Don't waste your time!";
    			if (img.src !== (img_src_value = "/img/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "banner-img");
    			attr_dev(img, "class", "svelte-38ww5f");
    			add_location(img, file, 2, 8, 26);
    			attr_dev(h10, "class", "svelte-38ww5f");
    			add_location(h10, file, 1, 4, 13);
    			attr_dev(h11, "class", "svelte-38ww5f");
    			add_location(h11, file, 4, 4, 83);
    			attr_dev(header, "class", "svelte-38ww5f");
    			add_location(header, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h10);
    			append_dev(h10, img);
    			append_dev(header, t0);
    			append_dev(header, h11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.7 */

    const file$1 = "src/components/Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let div;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			div.textContent = "Copyright 2020 Ariel the cat";
    			attr_dev(div, "class", "copyright svelte-1c086wt");
    			add_location(div, file$1, 1, 4, 13);
    			attr_dev(footer, "class", "svelte-1c086wt");
    			add_location(footer, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Tabs.svelte generated by Svelte v3.29.7 */
    const file$2 = "src/components/Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (13:4) {#each tabs as tab}
    function create_each_block(ctx) {
    	let li;
    	let div;
    	let t0_value = /*tab*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*tab*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "svelte-1pqr1l4");
    			toggle_class(div, "active", /*tab*/ ctx[4] === /*activeTab*/ ctx[1]);
    			add_location(div, file$2, 14, 4, 252);
    			attr_dev(li, "class", "svelte-1pqr1l4");
    			add_location(li, file$2, 13, 4, 200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*tabs*/ 1 && t0_value !== (t0_value = /*tab*/ ctx[4] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*tabs, activeTab*/ 3) {
    				toggle_class(div, "active", /*tab*/ ctx[4] === /*activeTab*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(13:4) {#each tabs as tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let ul;
    	let each_value = /*tabs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1pqr1l4");
    			add_location(ul, file$2, 11, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dispatch, tabs, activeTab*/ 7) {
    				each_value = /*tabs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", slots, []);
    	let dispatch = createEventDispatcher();
    	let { tabs } = $$props;
    	let { activeTab } = $$props;
    	const writable_props = ["tabs", "activeTab"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	const click_handler = tab => dispatch("changeTab", tab);

    	$$self.$$set = $$props => {
    		if ("tabs" in $$props) $$invalidate(0, tabs = $$props.tabs);
    		if ("activeTab" in $$props) $$invalidate(1, activeTab = $$props.activeTab);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		tabs,
    		activeTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) $$invalidate(2, dispatch = $$props.dispatch);
    		if ("tabs" in $$props) $$invalidate(0, tabs = $$props.tabs);
    		if ("activeTab" in $$props) $$invalidate(1, activeTab = $$props.activeTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tabs, activeTab, dispatch, click_handler];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { tabs: 0, activeTab: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabs*/ ctx[0] === undefined && !("tabs" in props)) {
    			console.warn("<Tabs> was created without expected prop 'tabs'");
    		}

    		if (/*activeTab*/ ctx[1] === undefined && !("activeTab" in props)) {
    			console.warn("<Tabs> was created without expected prop 'activeTab'");
    		}
    	}

    	get tabs() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTab() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTab(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const TimerStore = writable(
        {
          focusTime:20,
          shortBreakTime:5,
          longBreakTime:25,
          sessionRounds:4,
        },
      );

    /* src/components/Timer.svelte generated by Svelte v3.29.7 */
    const file$3 = "src/components/Timer.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let time;
    	let t0_value = /*formatTime*/ ctx[8](/*pomodoroTime*/ ctx[1]) + "";
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let div0;
    	let button0;
    	let t4;
    	let button0_disabled_value;
    	let t5;
    	let button1;
    	let t6;
    	let button1_disabled_value;
    	let t7;
    	let button2;
    	let t8;
    	let button2_disabled_value;
    	let t9;
    	let button3;
    	let t10;
    	let button3_disabled_value;
    	let t11;
    	let div1;
    	let button4;
    	let t13;
    	let div2;
    	let h30;
    	let t15;
    	let h31;
    	let t16;
    	let t17;
    	let t18_value = /*timerParameters*/ ctx[6].sessionRounds + "";
    	let t18;
    	let t19;
    	let h32;
    	let t21;
    	let h33;
    	let t22;
    	let div3_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			time = element("time");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*message*/ ctx[4]);
    			t3 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t4 = text("Start");
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Stop");
    			t7 = space();
    			button2 = element("button");
    			t8 = text("Pause");
    			t9 = space();
    			button3 = element("button");
    			t10 = text("Resume");
    			t11 = space();
    			div1 = element("div");
    			button4 = element("button");
    			button4.textContent = "Next Round";
    			t13 = space();
    			div2 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Sessions:";
    			t15 = space();
    			h31 = element("h3");
    			t16 = text(/*completedPomodoros*/ ctx[2]);
    			t17 = text("/");
    			t18 = text(t18_value);
    			t19 = space();
    			h32 = element("h3");
    			h32.textContent = "Tasks completed";
    			t21 = space();
    			h33 = element("h3");
    			t22 = text(/*tasks*/ ctx[5]);
    			attr_dev(time, "class", "svelte-18vcvcu");
    			add_location(time, file$3, 106, 4, 2765);
    			attr_dev(p, "class", "message svelte-18vcvcu");
    			add_location(p, file$3, 109, 4, 2821);
    			attr_dev(button0, "class", "primary svelte-18vcvcu");
    			button0.disabled = button0_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].idle;
    			add_location(button0, file$3, 111, 6, 2893);
    			button1.disabled = button1_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].inProgress;
    			attr_dev(button1, "class", "svelte-18vcvcu");
    			add_location(button1, file$3, 112, 6, 3002);
    			button2.disabled = button2_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].inProgress | /*paused*/ ctx[3];
    			attr_dev(button2, "class", "svelte-18vcvcu");
    			add_location(button2, file$3, 113, 6, 3101);
    			button3.disabled = button3_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].inProgress | !/*paused*/ ctx[3];
    			attr_dev(button3, "class", "svelte-18vcvcu");
    			add_location(button3, file$3, 114, 6, 3217);
    			attr_dev(div0, "class", "control-timer svelte-18vcvcu");
    			add_location(div0, file$3, 110, 4, 2858);
    			attr_dev(button4, "class", "svelte-18vcvcu");
    			add_location(button4, file$3, 117, 8, 3383);
    			attr_dev(div1, "class", "control-timer-2");
    			add_location(div1, file$3, 116, 4, 3345);
    			add_location(h30, file$3, 120, 8, 3461);
    			add_location(h31, file$3, 121, 8, 3488);
    			add_location(h32, file$3, 122, 8, 3558);
    			add_location(h33, file$3, 123, 8, 3591);
    			add_location(div2, file$3, 119, 4, 3447);
    			attr_dev(div3, "class", "timer svelte-18vcvcu");
    			add_location(div3, file$3, 105, 2, 2733);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, time);
    			append_dev(time, t0);
    			append_dev(div3, t1);
    			append_dev(div3, p);
    			append_dev(p, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(button0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			append_dev(button1, t6);
    			append_dev(div0, t7);
    			append_dev(div0, button2);
    			append_dev(button2, t8);
    			append_dev(div0, t9);
    			append_dev(div0, button3);
    			append_dev(button3, t10);
    			append_dev(div3, t11);
    			append_dev(div3, div1);
    			append_dev(div1, button4);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, h30);
    			append_dev(div2, t15);
    			append_dev(div2, h31);
    			append_dev(h31, t16);
    			append_dev(h31, t17);
    			append_dev(h31, t18);
    			append_dev(div2, t19);
    			append_dev(div2, h32);
    			append_dev(div2, t21);
    			append_dev(div2, h33);
    			append_dev(h33, t22);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*startPomodoro*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*cancelPomodoro*/ ctx[10], false, false, false),
    					listen_dev(button2, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button3, "click", /*click_handler_1*/ ctx[13], false, false, false),
    					listen_dev(button4, "click", /*nextRound*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pomodoroTime*/ 2 && t0_value !== (t0_value = /*formatTime*/ ctx[8](/*pomodoroTime*/ ctx[1]) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*message*/ 16) set_data_dev(t2, /*message*/ ctx[4]);

    			if (dirty & /*currentState*/ 1 && button0_disabled_value !== (button0_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].idle)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*currentState*/ 1 && button1_disabled_value !== (button1_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].inProgress)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*currentState, paused*/ 9 && button2_disabled_value !== (button2_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].inProgress | /*paused*/ ctx[3])) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			if (dirty & /*currentState, paused*/ 9 && button3_disabled_value !== (button3_disabled_value = /*currentState*/ ctx[0] !== /*State*/ ctx[7].inProgress | !/*paused*/ ctx[3])) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}

    			if (dirty & /*completedPomodoros*/ 4) set_data_dev(t16, /*completedPomodoros*/ ctx[2]);
    			if (dirty & /*tasks*/ 32) set_data_dev(t22, /*tasks*/ ctx[5]);
    		},
    		i: function intro(local) {
    			if (!div3_intro) {
    				add_render_callback(() => {
    					div3_intro = create_in_transition(div3, fade, {});
    					div3_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $TimerStore;
    	validate_store(TimerStore, "TimerStore");
    	component_subscribe($$self, TimerStore, $$value => $$invalidate(15, $TimerStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Timer", slots, []);
    	let timerParameters = $TimerStore;
    	const minutesToSeconds = minutes => minutes * 60;
    	const secondsToMinutes = seconds => Math.floor(seconds / 60);
    	const padWithZeroes = number => number.toString().padStart(2, "0");

    	const State = {
    		idle: "idle",
    		inProgress: "in progress",
    		resting: "resting"
    	};

    	const POMODORO_S = minutesToSeconds(timerParameters.focusTime);
    	const LONG_BREAK_S = minutesToSeconds(timerParameters.longBreakTime);
    	const SHORT_BREAK_S = minutesToSeconds(timerParameters.shortBreakTime);
    	let currentState = State.idle;
    	let pomodoroTime = POMODORO_S;
    	let completedPomodoros = 0;
    	let interval;
    	let paused = false;
    	let message = "READY TO START";
    	let tasks = 0;

    	function formatTime(timeInSeconds) {
    		const minutes = secondsToMinutes(timeInSeconds);
    		const remainingSeconds = timeInSeconds % 60;
    		return `${padWithZeroes(minutes)}:${padWithZeroes(remainingSeconds)}`;
    	}

    	function startPomodoro() {
    		setState(State.inProgress);
    		$$invalidate(4, message = "STAY FOCUSED");

    		interval = setInterval(
    			() => {
    				if (pomodoroTime === 0) {
    					completePomodoro();
    				}

    				if (paused) {
    					$$invalidate(1, pomodoroTime -= 0);
    				} else {
    					$$invalidate(1, pomodoroTime -= 1);
    				}
    			},
    			1000
    		);
    	}

    	function setState(newState) {
    		clearInterval(interval);
    		$$invalidate(0, currentState = newState);
    	}

    	function completePomodoro() {
    		$$invalidate(2, completedPomodoros++, completedPomodoros);

    		if (completedPomodoros === timerParameters.sessionRounds) {
    			$$invalidate(4, message = "TIME TO TAKE A LONG BREAK");
    			$$invalidate(5, tasks++, tasks);
    			rest(LONG_BREAK_S);
    			$$invalidate(2, completedPomodoros = 0);
    		} else {
    			$$invalidate(4, message = "TIME TO TAKE A SHORT BREAK");
    			rest(SHORT_BREAK_S);
    		}
    	}

    	function rest(time) {
    		setState(State.resting);
    		$$invalidate(1, pomodoroTime = time);

    		interval = setInterval(
    			() => {
    				if (pomodoroTime === 0) {
    					idle();
    				}

    				if (paused) {
    					$$invalidate(1, pomodoroTime -= 0);
    				} else {
    					$$invalidate(1, pomodoroTime -= 1);
    				}
    			},
    			1000
    		);
    	}

    	function cancelPomodoro() {
    		// TODO: Add some logic to prompt the user to write down
    		// the cause of the interruption.
    		idle();
    	}

    	function idle() {
    		setState(State.idle);
    		$$invalidate(1, pomodoroTime = POMODORO_S);
    	}

    	function nextRound() {
    		if (currentState === State.inProgress) {
    			completePomodoro();
    		} else if (currentState === State.resting) {
    			$$invalidate(4, message = "READY TO START");
    			idle();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(3, paused = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(3, paused = false);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		scale,
    		TimerStore,
    		timerParameters,
    		minutesToSeconds,
    		secondsToMinutes,
    		padWithZeroes,
    		State,
    		POMODORO_S,
    		LONG_BREAK_S,
    		SHORT_BREAK_S,
    		currentState,
    		pomodoroTime,
    		completedPomodoros,
    		interval,
    		paused,
    		message,
    		tasks,
    		formatTime,
    		startPomodoro,
    		setState,
    		completePomodoro,
    		rest,
    		cancelPomodoro,
    		idle,
    		nextRound,
    		$TimerStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("timerParameters" in $$props) $$invalidate(6, timerParameters = $$props.timerParameters);
    		if ("currentState" in $$props) $$invalidate(0, currentState = $$props.currentState);
    		if ("pomodoroTime" in $$props) $$invalidate(1, pomodoroTime = $$props.pomodoroTime);
    		if ("completedPomodoros" in $$props) $$invalidate(2, completedPomodoros = $$props.completedPomodoros);
    		if ("interval" in $$props) interval = $$props.interval;
    		if ("paused" in $$props) $$invalidate(3, paused = $$props.paused);
    		if ("message" in $$props) $$invalidate(4, message = $$props.message);
    		if ("tasks" in $$props) $$invalidate(5, tasks = $$props.tasks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentState,
    		pomodoroTime,
    		completedPomodoros,
    		paused,
    		message,
    		tasks,
    		timerParameters,
    		State,
    		formatTime,
    		startPomodoro,
    		cancelPomodoro,
    		nextRound,
    		click_handler,
    		click_handler_1
    	];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Options.svelte generated by Svelte v3.29.7 */

    const { console: console_1 } = globals;
    const file$4 = "src/components/Options.svelte";

    // (48:8) {#if !valid}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Zero or negative values not admitted";
    			attr_dev(p, "class", "error svelte-9py2xz");
    			add_location(p, file$4, 48, 8, 1887);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(48:8) {#if !valid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let form;
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let div2;
    	let label2;
    	let t7;
    	let input2;
    	let t8;
    	let div3;
    	let label3;
    	let t10;
    	let input3;
    	let t11;
    	let t12;
    	let button;
    	let form_intro;
    	let mounted;
    	let dispose;
    	let if_block = !/*valid*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Stay Focus Time";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Short Break Time";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Long Break Time";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Session Rounds";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			button = element("button");
    			button.textContent = "Start";
    			attr_dev(label0, "for", "focus-time");
    			attr_dev(label0, "class", "svelte-9py2xz");
    			add_location(label0, file$4, 32, 12, 1048);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "id", "focus-time");
    			attr_dev(input0, "min", "1");
    			attr_dev(input0, "class", "svelte-9py2xz");
    			add_location(input0, file$4, 33, 12, 1108);
    			attr_dev(div0, "class", "form-field svelte-9py2xz");
    			add_location(div0, file$4, 31, 8, 1011);
    			attr_dev(label1, "for", "short-break-time");
    			attr_dev(label1, "class", "svelte-9py2xz");
    			add_location(label1, file$4, 36, 12, 1251);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "short-break-time");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "class", "svelte-9py2xz");
    			add_location(input1, file$4, 37, 12, 1318);
    			attr_dev(div1, "class", "form-field svelte-9py2xz");
    			add_location(div1, file$4, 35, 8, 1214);
    			attr_dev(label2, "for", "long-break-time");
    			attr_dev(label2, "class", "svelte-9py2xz");
    			add_location(label2, file$4, 40, 12, 1472);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "id", "long-break-time");
    			attr_dev(input2, "min", "1");
    			attr_dev(input2, "class", "svelte-9py2xz");
    			add_location(input2, file$4, 41, 12, 1537);
    			attr_dev(div2, "class", "form-field svelte-9py2xz");
    			add_location(div2, file$4, 39, 8, 1435);
    			attr_dev(label3, "for", "session-rounds");
    			attr_dev(label3, "class", "svelte-9py2xz");
    			add_location(label3, file$4, 44, 12, 1689);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "id", "session-rounds");
    			attr_dev(input3, "min", "1");
    			attr_dev(input3, "class", "svelte-9py2xz");
    			add_location(input3, file$4, 45, 12, 1752);
    			attr_dev(div3, "class", "form-field svelte-9py2xz");
    			add_location(div3, file$4, 43, 8, 1652);
    			add_location(button, file$4, 50, 8, 1967);
    			attr_dev(form, "class", "svelte-9py2xz");
    			add_location(form, file$4, 30, 4, 947);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*updatedFields*/ ctx[0].focusTime);
    			append_dev(form, t2);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*updatedFields*/ ctx[0].shortBreakTime);
    			append_dev(form, t5);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t7);
    			append_dev(div2, input2);
    			set_input_value(input2, /*updatedFields*/ ctx[0].longBreakTime);
    			append_dev(form, t8);
    			append_dev(form, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t10);
    			append_dev(div3, input3);
    			set_input_value(input3, /*updatedFields*/ ctx[0].sessionRounds);
    			append_dev(form, t11);
    			if (if_block) if_block.m(form, null);
    			append_dev(form, t12);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[5]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[6]),
    					listen_dev(form, "submit", prevent_default(/*submitHandler*/ ctx[2]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*updatedFields*/ 1 && to_number(input0.value) !== /*updatedFields*/ ctx[0].focusTime) {
    				set_input_value(input0, /*updatedFields*/ ctx[0].focusTime);
    			}

    			if (dirty & /*updatedFields*/ 1 && to_number(input1.value) !== /*updatedFields*/ ctx[0].shortBreakTime) {
    				set_input_value(input1, /*updatedFields*/ ctx[0].shortBreakTime);
    			}

    			if (dirty & /*updatedFields*/ 1 && to_number(input2.value) !== /*updatedFields*/ ctx[0].longBreakTime) {
    				set_input_value(input2, /*updatedFields*/ ctx[0].longBreakTime);
    			}

    			if (dirty & /*updatedFields*/ 1 && to_number(input3.value) !== /*updatedFields*/ ctx[0].sessionRounds) {
    				set_input_value(input3, /*updatedFields*/ ctx[0].sessionRounds);
    			}

    			if (!/*valid*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(form, t12);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (!form_intro) {
    				add_render_callback(() => {
    					form_intro = create_in_transition(form, fade, {});
    					form_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $TimerStore;
    	validate_store(TimerStore, "TimerStore");
    	component_subscribe($$self, TimerStore, $$value => $$invalidate(8, $TimerStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Options", slots, []);
    	const dispatch = createEventDispatcher();
    	let fields = $TimerStore;
    	let updatedFields = fields;
    	let valid = true;

    	const submitHandler = () => {
    		if (updatedFields.focusTime <= 0 | updatedFields.shortBreakTime <= 0 | updatedFields.longBreakTime <= 0 | updatedFields.sessionRounds <= 0) {
    			fields = {
    				focusTime: 20,
    				shortBreakTime: 5,
    				longBreakTime: 25,
    				sessionRounds: 4
    			};

    			TimerStore.update(fields => {
    				console.log(fields);
    				return fields;
    			});

    			$$invalidate(1, valid = false);
    		} else {
    			TimerStore.update(fields => {
    				return updatedFields;
    			});

    			dispatch("handleOptions");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Options> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		updatedFields.focusTime = to_number(this.value);
    		$$invalidate(0, updatedFields);
    	}

    	function input1_input_handler() {
    		updatedFields.shortBreakTime = to_number(this.value);
    		$$invalidate(0, updatedFields);
    	}

    	function input2_input_handler() {
    		updatedFields.longBreakTime = to_number(this.value);
    		$$invalidate(0, updatedFields);
    	}

    	function input3_input_handler() {
    		updatedFields.sessionRounds = to_number(this.value);
    		$$invalidate(0, updatedFields);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		scale,
    		createEventDispatcher,
    		TimerStore,
    		dispatch,
    		fields,
    		updatedFields,
    		valid,
    		submitHandler,
    		$TimerStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("fields" in $$props) fields = $$props.fields;
    		if ("updatedFields" in $$props) $$invalidate(0, updatedFields = $$props.updatedFields);
    		if ("valid" in $$props) $$invalidate(1, valid = $$props.valid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		updatedFields,
    		valid,
    		submitHandler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class Options extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Options",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.7 */
    const file$5 = "src/App.svelte";

    // (28:35) 
    function create_if_block_1(ctx) {
    	let options;
    	let current;
    	options = new Options({ $$inline: true });
    	options.$on("handleOptions", /*handleOptions*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(options.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(options, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(options.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(options.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(options, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(28:35) ",
    		ctx
    	});

    	return block;
    }

    // (26:1) {#if activeTab === 'Timer'}
    function create_if_block$1(ctx) {
    	let timer;
    	let current;
    	timer = new Timer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(timer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(timer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(26:1) {#if activeTab === 'Timer'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let header;
    	let t0;
    	let body;
    	let tabs_1;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let t2;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });

    	tabs_1 = new Tabs({
    			props: {
    				tabs: /*tabs*/ ctx[1],
    				activeTab: /*activeTab*/ ctx[0]
    			},
    			$$inline: true
    		});

    	tabs_1.$on("changeTab", /*changeTab*/ ctx[2]);
    	const if_block_creators = [create_if_block$1, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*activeTab*/ ctx[0] === "Timer") return 0;
    		if (/*activeTab*/ ctx[0] === "Options") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			body = element("body");
    			create_component(tabs_1.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			create_component(footer.$$.fragment);
    			add_location(body, file$5, 23, 0, 506);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			mount_component(tabs_1, body, null);
    			append_dev(body, t1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(body, null);
    			}

    			insert_dev(target, t2, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_1_changes = {};
    			if (dirty & /*activeTab*/ 1) tabs_1_changes.activeTab = /*activeTab*/ ctx[0];
    			tabs_1.$set(tabs_1_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(body, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(tabs_1.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(tabs_1.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			destroy_component(tabs_1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching) detach_dev(t2);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let tabs = ["Timer", "Options"];
    	let activeTab = "Options";

    	const changeTab = e => {
    		$$invalidate(0, activeTab = e.detail);
    	};

    	const handleOptions = () => {
    		$$invalidate(0, activeTab = "Timer");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		Footer,
    		Tabs,
    		Timer,
    		Options,
    		TimerStore,
    		tabs,
    		activeTab,
    		changeTab,
    		handleOptions
    	});

    	$$self.$inject_state = $$props => {
    		if ("tabs" in $$props) $$invalidate(1, tabs = $$props.tabs);
    		if ("activeTab" in $$props) $$invalidate(0, activeTab = $$props.activeTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [activeTab, tabs, changeTab, handleOptions];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
