<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import { browser } from "$app/environment";
    import { writable } from "svelte/store";
    import {
        get_local_storage_array_store,
        fetch_text,
        get_local_storage_store,
        get_local_storage_dict_store,
    } from "$lib/stores";
    import OutputComponent from "$lib/OutputComponent.svelte";

    export let history = writable<Array<string>>();
    export let username = writable<string>();
    export let userfiles = writable<Map<string, string>>();

    let command = "";
    let input;
    let focused = true;
    let lcActive = false;
    let old_output = [],
        output = [];
    $: currentCommand = -1;
    $: useHistory = false;
    $: command_s = !useHistory
        ? (command ?? "")
        : $history[$history.length - 1 - currentCommand];
    $: userString = $username + "@blog:~$ ";
    let old_command_s = command_s,
        posts = 1,
        ctrl = false;

    $: cursor = false;
    $: command_line = false;

    afterUpdate(() => {
        if (output.size !== old_output.size || command_s != old_command_s) {
            window.scrollTo(0, document.body.scrollHeight);
            old_output = output;
            old_command_s = command_s;
        }
    });

    onMount(() => {
        setInterval(() => {
            cursor = !cursor;
            if (!focused) cursor = false;
        }, 600);

        initialize();
        finish_login();
    });

    async function finish_login() {
        let banner = await fetch_text("/userdir/banner.html");

        output.push({
            type: "text",
            text: banner
                .replace("{date}", new Date())
                .replace("{agent}", navigator.userAgent),
        });
        output = output;
        command_line = true;
    }

    function initialize() {
        history = get_local_storage_array_store("history", []);

        username = get_local_storage_store("user", "bjarne");
        userfiles = get_local_storage_dict_store(
            "files",
            new Map<string, string>(),
        );
    }

    function key_up(event) {
        if (event.key === "Control") {
            ctrl = false;
        }
    }

    function key_press(event) {
        switch (event.key) {
            case "Control":
                ctrl = true;
                break;
            case "c":
                if (ctrl) {
                    if (useHistory) {
                        command =
                            $history[$history.length - 1 - currentCommand];
                        useHistory = false;
                    }
                    output.push({
                        type: "text",
                        text: lcActive
                            ? userString + command + "^C<br>"
                            : "^C<br>",
                    });
                    output = output;
                    command = "";
                    currentCommand = -1;
                    lcActive = true;
                    event.preventDefault();
                }
                break;
            case "ArrowUp":
                event.preventDefault();
                if (lcActive) break;
                if ($history.length - 1 > currentCommand) {
                    useHistory = true;
                    currentCommand++;
                }
                break;
            case "ArrowDown":
                event.preventDefault();
                if (lcActive) break;
                if (useHistory && currentCommand != 0) currentCommand -= 1;
                else {
                    useHistory = false;
                    currentCommand = -1;
                }
                break;
            case "Enter":
                event.preventDefault();
                if (lcActive) break;
                if (useHistory) {
                    command = $history[$history.length - 1 - currentCommand];
                    useHistory = false;
                }
                if (command == "") {
                    output.push({ type: "text", text: userString + "<br>" });
                    output = output;
                    break;
                }
                let save = command;
                history.set([...$history, save]);
                currentCommand = -1;
                command_line = false;
                command = "";
                output.push({ type: "text", text: userString + save + "<br>" });
                output = output;
                execute_c(save, event);
                break;
            default:
                if (lcActive) {
                    event.preventDefault();
                    break;
                }
                if (useHistory) {
                    command = $history[$history.length - 1 - currentCommand];
                    useHistory = false;
                }
        }
    }

    async function execute_c(exec, event) {
        try {
            await execute(exec, event);
        } catch (e) {
            output.push({ type: "text", text: "Encountered an error: " + e });
        }
        if (output.length !== 0) output.push({ type: "br" });
        output = output;
        command_line = true;
    }

    async function execute(exec, event) {
        switch (exec.split(" ")[0]) {
            case "":
                break;
            case "ls":
                let filter =
                    exec.split(" ").size === 1 ||
                    (exec.split(" ")[1] !== "-a" &&
                        exec.split(" ")[1] !== "--all");
                let files = [];
                $userfiles.forEach((value: string, key: string) => {
                    if (filter && key[0] === ".") return;
                    files.push(key);
                });
                for (let i = posts; i > 0; i--)
                    files = [...files, "post" + i + ".txt"];
                files = files.sort(function (a, b) {
                    return a.localeCompare(b);
                });
                let fileString = "";
                for (let i = 0; i < files.length; i++)
                    fileString += files[i] + " ";
                output.push({ type: "text", text: fileString });
                break;
            case "help":
                let help = await fetch_text("/userdir/help.html");
                output.push({ type: "text", text: help });
                break;
            case "clear":
                output = [];
                break;
            case "touch":
                if (exec.split(" ").length < 2) {
                    output.push({
                        type: "text",
                        text: "What should I do now? There is nothing to do! Try again.",
                    });
                    break;
                }
                //if (exec.split(" ")[1] !== ".hushlogin")
                //    output +=
                //        "I am sorry, but this is my blog. Why do you want to add files??";
                else {
                    let fileName = exec.split(" ")[1];
                    let files = $userfiles;
                    if (!files.has(fileName)) files.set(fileName, "");
                    userfiles.set(files);
                    output.push({
                        type: "text",
                        text: "Created file.",
                    });
                }
                break;
            case "rm":
                if (exec.split(" ").length < 2) {
                    output.push({
                        type: "text",
                        text: "What are you trying to delete? Try again.",
                    });
                    break;
                }
                if (
                    exec.split(" ")[1] === "-a" ||
                    exec.split(" ")[1] === "--all"
                ) {
                    userfiles.set(new Map<string, string>());
                    output.push({
                        type: "text",
                        text: "Successful. Cleared all user specific files.",
                    });
                    break;
                }
                if (!$userfiles.has(exec.split(" ")[1]))
                    output.push({
                        type: "text",
                        text: "Missing file permissions. :(",
                    });
                else {
                    if ($userfiles.size > 1) {
                        $userfiles.delete(exec.split(" ")[1]);
                        userfiles.set($userfiles);
                    } else userfiles.set(new Map<string, string>());
                    output.push({
                        type: "text",
                        text: "Deleted file.",
                    });
                }
                break;
            case "cat":
                if (exec.split(" ").length < 2) {
                    output.push({
                        type: "text",
                        text: "What are you trying to print? Try again.",
                    });
                    break;
                }
                let post = await fetch_text("/posts/" + exec.split(" ")[1]);
                if (post === "error") {
                    output.push({
                        type: "text",
                        text: "An error occured. Are you sure this post exists?",
                    });
                    break;
                }
                output.push({
                    type: "md",
                    text: post,
                    id: exec.split(" ")[1],
                });
                break;
            case "useradd":
                if (exec.split(" ").length < 2) {
                    output.push({
                        type: "text",
                        text: "I don't know anyone without a name. Try again please.",
                    });
                    break;
                }
                username.set(exec.split(" ")[1]);
                output.push({
                    type: "text",
                    text: "Successful. Is this supposed to be a fresh start? :)",
                });
                break;
            case "play":
                if (exec.split(" ").length < 2) {
                    output.push({
                        type: "text",
                        text: "Can't play something that doesn't exist!",
                    });
                    break;
                }
                let postl = await fetch_text("/posts/" + exec.split(" ")[1]);
                if (postl === "error") {
                    output.push({
                        type: "text",
                        text: "An error occured. Are you sure this post exists?",
                    });
                    break;
                }
                output.push({
                    type: "audio",
                    id: exec.split(" ")[1],
                    text: "",
                });
                break;
            default:
                output.push({
                    type: "text",
                    text: "It seems like you tried an unknown command. Why don't you try 'help'?",
                });
        }
    }
</script>

<svelte:window on:keydown={key_press} on:keyup={key_up} />
<input
    bind:this={input}
    bind:value={command}
    on:focus={() => {
        focused = true;
    }}
    on:blur={() => {
        focused = false;
    }}
    type="text"
    id="inputc"
/>

<div id="content">
    <p>
        {#each output as data}
            <OutputComponent
                bind:data
                islast={output[output.length - 1].type === "br"
                    ? data === output[output.length - 2]
                    : data === output[output.length - 1]}
                bind:active={lcActive}
            />
        {/each}
    </p>
    {#if !lcActive && command_line}
        <p style="padding-bottom: 10px">
            {userString}{command_s}{#if cursor}|{/if}
        </p>
    {/if}
</div>

<style>
    * {
        padding: 0;
        margin: 0;
    }

    #content {
        pointer-events: none;
        width: 95%;
        max-width: 95%;
        max-height: 100vh;
        height: 95%;
        padding: 0;
        margin: 10px;
        border: none;
    }

    p {
        font-family:
            Consolas,
            Courier New;
        margin-right: 10px;
        margin-bottom: 0;
    }

    #inputc {
        width: 95%;
        height: 95%;
        position: absolute;
        margin: 0;
        padding: 0;
        background-color: transparent;
        color: transparent;
        border: none;
        hover: none;
        z-layer: 1;
        outline: none;
    }

    #inputc::selection {
        background-color: transparent;
        color: transparent;
    }
</style>
