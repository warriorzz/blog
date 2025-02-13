<script>
    import SvelteMarkdown from "svelte-markdown";
    import { Howl } from "howler";
    import { onMount, onDestroy } from "svelte";
    export let data;
    export let islast;
    export let active;

    let sound;
    let div;
    let maxLetters;
    let curr = 0;
    let interval;

    onMount(() => {
        if (data.type === "audio" && islast && data.active !== false) {
            active = true;
            data.text = "Loading '" + data.id + "'...";
            initSound();
        } else {
            active = false;
        }
    });

    onDestroy(() => {
        quit();
    });

    function quit() {
        if (sound === undefined) return;
        sound.stop();
        clearInterval(interval);
        renderSound();
    }

    function initSound() {
        sound = new Howl({
            src: "/~beberhardt/posts/" + data.id + ".mp3",
            volume: 1,
            loop: false,
            autoplay: true,
            onplay: () => {
                initPlay();
            },
            onend: () => {
                curr = sound.duration();
                quit();
            },
        });
    }

    function initPlay() {
        maxLetters = div.clientWidth / 9.6 - 10;
        if (maxLetters > 80) maxLetters = 80;
        if (maxLetters < 3) maxLetters = 3;
        interval = setInterval(() => {
            renderSound();
            curr += 0.2;
            data = data;
            if (!islast) {
                quit();
            }
        }, 200);
    }

    function renderSound() {
        let current = curr;

        let duration = sound.duration();
        let position = current / duration;

        let before = Math.floor(maxLetters * position);
        let after = maxLetters - before - 1;
        if (current > duration) {
            current = duration;
            clearInterval(interval);
        }
        data.text =
            "Currently playing: " +
            data.id +
            "<br/><br/>" +
            (duration >= 600 && Math.floor(current / 60) < 10 ? "0" : "") +
            Math.floor(current / 60).toLocaleString("en-US", {
                maximumFractionDigits: 0,
            }) +
            ":" +
            (current % 60 < 10 ? "0" : "") +
            Math.floor(current % 60).toLocaleString("en-US", {
                maximumFractionDigits: 0,
            }) +
            " ";
        for (let i = 0; i < before && i < maxLetters; i++) {
            data.text += "―";
        }
        data.text += "⊰⊱";
        for (let i = 0; i < after; i++) {
            data.text += "―";
        }
        data.text +=
            " " +
            Math.floor(duration / 60).toLocaleString("en-US", {
                maximumFractionDigits: 0,
            }) +
            ":" +
            (duration % 60 < 10 ? "0" : "") +
            Math.floor(duration % 60).toLocaleString("en-US", {
                maximumFractionDigits: 0,
            });
    }
</script>

{#if data.type === "text"}
    {@html data.text}
{/if}
{#if data.type === "md"}
    <i>You can also listen to this blog post by typing "play {data.id}".</i>
    <SvelteMarkdown source={data.text} />
{/if}
{#if data.type === "audio"}
    <div bind:this={div} style="width: 95vw; display: block">
        {@html data.text}
    </div>
{/if}
{#if data.type === "br"}
    <br />
{/if}

<style>
    * {
        font-family:
            Consolas,
            Courier New;
        margin-right: 10px;
        margin-bottom: 0;
    }
</style>
