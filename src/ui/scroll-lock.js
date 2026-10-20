let locked = 0;
let previous = '';

export function lockPageScroll() {
  if (locked === 0) {
    previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  locked += 1;
}

export function unlockPageScroll() {
  locked = Math.max(0, locked - 1);
  if (locked === 0) document.documentElement.style.overflow = previous;
}
