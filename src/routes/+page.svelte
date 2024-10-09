<script lang="ts">
    let command = "";
    $: currentCommand = -1;
    $: useHistory = false;
    let commandHistory = [];
    $: command_s = !useHistory
        ? command
        : commandHistory[commandHistory.length - 1 - currentCommand];

    let output = "";

    let userString = "bjarne@blog:~$ ";

    let posts = ["post1.txt", "post2.txt"];

    let help =
        "Available commands: - cat <br> - ls <br> - flipper <br> - help <br> - clear";

    let key;
    function key_press(event) {
        key = event.key;
        switch (event.key) {
            case "ArrowUp":
                if (commandHistory.length - 1 > currentCommand) {
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
                commandHistory[commandHistory.length] = command;
                let save = command;
                command = "";
                output += userString + save + "<br>";
                execute(save);
                break;
            default:
                if (useHistory) {
                    command = commandHistory[currentCommand];
                    useHistory = false;
                }
                if (event.key === "Backspace")
                    command = command.substring(0, command.length - 1);
                if ((event.key + "").length == 1) command += event.key;
        }
    }

    function execute(command) {
        switch (command.split(" ")[0]) {
            case "ls":
                output += posts.join(" ");
                break;
            case "help":
                output += help;
                break;
            case "clear":
                output = "";
                break;
            default:
                output +=
                    "It seems like you tried an unknown command. Why don't you try 'help'?";
        }
        if (output !== "") output += "<br>";
    }
</script>

<svelte:window on:keydown={key_press} />
<div id="content">
    <p>{@html output}</p>
    <p>{userString}{command_s}</p>
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

    .horizontal {
        display: flex;
        max-width: 100%;
    }
</style>
