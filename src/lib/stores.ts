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
  let store = writable<Map<string, string>>();
  let initialValue =
    JSON.parse(window.localStorage.getItem(name) ?? "{}") ?? default_value;
  store.subscribe((value) =>
    window.localStorage.setItem(name, JSON.stringify(value)),
  );
  store.set(initialValue);
  return store;
}

export async function fetch_text(path: string) {
  let response = await fetch("/~beberhardt" + path);
  if (!response.ok) {
    return "An error occured. Are you sure this file exists?";
  }
  let text = response.text();
  return text;
}
