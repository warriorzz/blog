import { writable } from "svelte/store";

export function get_local_storage_store(name: string, default_value: string) {
  let store = writable<string>();
  let initialValue = window.localStorage.getItem(name) ?? default_value;
  store.subscribe((value) => window.localStorage.setItem(name, value));
  store.set(initialValue);
  return store;
}

export function get_local_storage_array_store(
  name: string,
  default_value: Array<string>,
) {
  let store = writable<Array<string>>();
  let initialValue =
    JSON.parse(window.localStorage.getItem(name) ?? "[]") ?? default_value;
  store.subscribe((value) =>
    window.localStorage.setItem(name, JSON.stringify(value)),
  );
  store.set(initialValue);
  return store;
}

export function get_local_storage_dict_store(
  name: string,
  default_value: Map<string, string>,
) {
  let initialValue =
    new Map<string, string>(
      Object.entries(JSON.parse(window.localStorage.getItem(name) ?? "{}")),
    ) ?? default_value;
  let store = writable<Map<string, string>>();
  store.subscribe((value) => {
    if (value === undefined) return;
    let str = "";
    value.forEach((value, key) => {
      str += '"' + key + '": "' + value + '",';
    });
    window.localStorage.setItem(
      name,
      "{" + str.substring(0, str.length - 1) + "}",
    );
  });
  //if (initialValue.size === 0) initialValue.set(".settings", "");
  store.set(initialValue);
  return store;
}

export async function fetch_text(path: string) {
  let response = await fetch("/~beberhardt" + path);
  //let response = await fetch(path);
  if (!response.ok) {
    return "error";
  }
  let text = response.text();
  return text;
}
