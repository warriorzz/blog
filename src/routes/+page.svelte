<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { writable } from "svelte/store";

    let history = writable<Array<string>>();

    let command = "";
    $: currentCommand = -1;
    $: useHistory = false;
    $: command_s = !useHistory
        ? (command ?? "")
        : $history[$history.length - 1 - currentCommand];

    let output = "",
        posts = 1,
        userString = "@blog:~$ ",
        hushLogin = false,
        banner = "";

    $: cursor = false;
    $: command_line = false;

    onMount(() => {
        setInterval(() => {
            cursor = !cursor;
        }, 600);
        let initialValue =
            JSON.parse(window.localStorage.getItem("history") ?? "[]") ??
            <Array<string>>[];
        history.subscribe((value) =>
            window.localStorage.setItem("history", JSON.stringify(value)),
        );
        history.set(initialValue);

        userString = get_property("user", "bjarne") + userString;
        hushLogin = get_property("hushlogin", "false") == "true";

        finish_login();
    });

    async function finish_login() {
        banner = await fetch_text("/userdir/banner.txt");
        if (!hushLogin) print_banner();
        command_line = true;
    }

    function print_banner() {
        output += banner
            .replace("{date}", new Date())
            .replace("{agent}", navigator.userAgent);
        console.log("banner");
    }

    function get_property(name: string, default_s: string) {
        return window.localStorage.getItem(name) ?? default_s;
    }

    async function fetch_text(path) {
        let response = await fetch(path);
        if (!response.ok) {
            return "An error occured. Are you sure this file exists?";
        }
        let text = response.text();
        return text;
    }

    function key_press(event) {
        switch (event.key) {
            case "ArrowUp":
                if ($history.length - 1 > currentCommand) {
                    useHistory = true;
                    currentCommand++;
                }
                break;
            case "ArrowDown":
                if (useHistory && currentCommand != 0) currentCommand -= 1;
                else {
                    useHistory = false;
                    currentCommand = -1;
                }
                break;
            case "Enter":
                useHistory = false;
                currentCommand = -1;
                if (command == "") {
                    output += userString + "<br>";
                    break;
                }
                let save = command;
                history.set([...$history, save]);
                command_line = false;
                command = "";
                output += userString + save + "<br>";
                execute(save);
                break;
            default:
                if (useHistory) {
                    command = history[currentCommand];
                    useHistory = false;
                }
                if (event.key === "Backspace")
                    command = command.substring(0, command.length - 1);
                if ((event.key + "").length == 1) command += event.key;
        }
    }

    async function execute(exec: string) {
        switch (exec.split(" ")[0]) {
            case "ls":
                for (let i = posts; i > 0; i--) output += "post" + i + ".txt ";
                break;
            case "help":
                let help = await fetch_text("/userdir/help.txt");
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
                if (exec.split(" ")[1] !== ".hushlogin")
                    output +=
                        "I am sorry, but this is my blog. Why do you want to add files??";
                else {
                    window.localStorage.setItem("hushlogin", "true");
                    output += "Created file.";
                }
                break;
            case "rm":
                if (exec.split(" ").length < 2) {
                    output += "What are you trying to delete? Try again.";
                    break;
                }
                if (exec.split(" ")[1] !== ".hushlogin")
                    output += "Missing file permissions. :(";
                else {
                    window.localStorage.setItem("hushlogin", "false");
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
                window.localStorage.setItem("user", exec.split(" ")[1]);
                output +=
                    "Successful. Please log out and in again to change users.";
                break;
            default:
                output +=
                    "It seems like you tried an unknown command. Why don't you try 'help'?";
        }
        if (output !== "") output += "<br>";
        command_line = true;
    }
</script>

<svelte:window on:keydown={key_press} />
<div id="content">
    <p>{@html output}</p>
    {#if command_line}
        <p>
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
        height: 95%;
        padding: 0;
        margin: 10px;
        border: none;
    }

    p {
        font-family: Consolas;
        margin-right: 10px;
    }
</style>
