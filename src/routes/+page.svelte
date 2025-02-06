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

    export let history = writable<Array<string>>();
    export let username = writable<string>();
    export let hushLogin_store = writable<string>();
    let userfiles = writable<Map<string, string>>();

    let command = "";
    let input;
    $: currentCommand = -1;
    $: useHistory = false;
    $: command_s = !useHistory
        ? (command ?? "")
        : $history[$history.length - 1 - currentCommand];
    $: userString = $username + "@blog:~$ ";
    $: hushLogin = $hushLogin_store === "true";

    let output = "",
        old_output = "",
        old_command_s = command_s,
        posts = 1,
        banner = "",
        is_mobile = false;

    $: cursor = false;
    $: command_line = false;

    afterUpdate(() => {
        if (output !== old_output || command_s != old_command_s) {
            window.scrollTo(0, document.body.scrollHeight);
            old_output = output;
            old_command_s = command_s;
        }
    });

    onMount(() => {
        setInterval(() => {
            cursor = !cursor;
        }, 600);

        is_mobile =
            navigator.userAgent.includes("Android") ||
            navigator.userAgent.includes("iPhone") ||
            navigator.userAgent.includes("iPad");

        history = get_local_storage_array_store("history", []);

        username = get_local_storage_store("user", "bjarne");
        hushLogin_store = get_local_storage_store("hushlogin", "false");
        userfiles = get_local_storage_dict_store("files", {});

        finish_login();
    });

    async function finish_login() {
        banner = await fetch_text("/userdir/banner.html");
        if (!hushLogin) print_banner();
        command_line = true;
    }

    function print_banner() {
        output += banner
            .replace("{date}", new Date())
            .replace("{agent}", navigator.userAgent);
    }

    function key_press(event) {
        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                if ($history.length - 1 > currentCommand) {
                    useHistory = true;
                    currentCommand++;
                }
                break;
            case "ArrowDown":
                event.preventDefault();
                if (useHistory && currentCommand != 0) currentCommand -= 1;
                else {
                    useHistory = false;
                    currentCommand = -1;
                }
                break;
            case "Enter":
                if (useHistory) {
                    command = $history[$history.length - 1 - currentCommand];
                    useHistory = false;
                }
                if (command == "") {
                    output += userString + "<br>";
                    break;
                }
                let save = command;
                history.set([...$history, save]);
                currentCommand = -1;
                command_line = false;
                command = "";
                output += userString + save + "<br>";
                execute_c(save, event);
                break;
            default:
                if (useHistory) {
                    command = $history[$history.length - 1 - currentCommand];
                    useHistory = false;
                }
                if (event.key === "Backspace")
                    command = command.substring(0, command.length - 1);
                if ((event.key + "").length == 1) {
                    command += event.key;
                    event.preventDefault();
                }
        }
    }

    async function execute_c(exec, event) {
        try {
            await execute(exec, event);
        } catch (e) {
            output += "Encountered an error: " + e;
        }
        if (output !== "") output += "<br>";
        command_line = true;
    }

    async function execute(exec, event) {
        switch (exec.split(" ")[0]) {
            case "ls":
                let files = [];
                for (let i = 0, item; (item = $userfiles.keys().next()); i++) {
                    files.push(file);
                }
                for (let i = posts; i > 0; i--)
                    files = [...files, "posts/post" + i + ".txt"];
                files = files.sort(function (a, b) {
                    return a.localeCompare(b);
                });
                for (let i = 0; i < files.length; i++) output += files[i] + " ";
                break;
            case "help":
                let help = await fetch_text("/userdir/help.html");
                output += help;
                break;
            case "clear":
                output = "";
                break;
            case "touch":
                if (exec.split(" ").length < 2) {
                    output +=
                        "What should I do now? There is nothing to do! Try again.";
                    break;
                }
                //if (exec.split(" ")[1] !== ".hushlogin")
                //    output +=
                //        "I am sorry, but this is my blog. Why do you want to add files??";
                else {
                    let fileName = exec.split(" ")[1];
                    let files = $userfiles;
                    if (!files.has(fileName)) files.set(fileName, "");
                    else console.log("file existss");
                    userfiles.set(files);
                    output += "Created file.";
                }
                break;
            case "rm":
                if (exec.split(" ").length < 2) {
                    output += "What are you trying to delete? Try again.";
                    break;
                }
                if (!$userfiles.contains(exec.split(" ")[1]))
                    output += "Missing file permissions. :(";
                else {
                    userfiles.set($userfiles.remove(exec.split(" ")[1]));
                    output += "Deleted file.";
                }
                break;
            case "cat":
                if (exec.split(" ").length < 2) {
                    output += "What are you trying to print? Try again.";
                    break;
                }
                let post = await fetch_text("/posts/" + exec.split(" ")[1]);
                output += post;
                break;
            case "useradd":
                if (exec.split(" ").length < 2) {
                    output +=
                        "I don't know anyone without a name. Try again please.";
                    break;
                }
                username.set(exec.split(" ")[1]);
                output +=
                    "Successful. Please log out and in again to change users.";
                break;
            default:
                output +=
                    "It seems like you tried an unknown command. Why don't you try 'help'?";
        }
    }
</script>

<svelte:window on:keydown={key_press} />
<div id="content">
    <p>{@html output}</p>
    {#if command_line}
        <p>
            {userString}{command_s}{#if cursor}|{/if}
        </p>
        <input
            bind:this={input}
            bind:value={command}
            type="text"
            style="width: 0px; height: 0px; border: none; hover: none; outline: none;"
        />
    {/if}
</div>
{#if is_mobile}
    <button
        on:click={(e) => {
            e.preventDefault();
            input.focus();
        }}
        style="position: fixed; right: 10px; bottom: 10px; height: 20px"
        transition>Open Keyboard</button
    >
{/if}

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
</style>
