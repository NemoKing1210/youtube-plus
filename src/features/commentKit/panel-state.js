export function createPanelState(read, write) {
  let open = read() === true;
  return {
    get open() { return open; },
    setOpen(next) {
      if (next === open) return;
      open = next;
      write(open);
    },
  };
}
