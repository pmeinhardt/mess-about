'use strict';

// machine visualization and debugging

const lpad = (str, chr, n) => {
  let res = str;
  while (res.length < n) res = chr + res;
  return res;
};

const debug = (i, grid, iptr, movm, stack, out) => {
  console.log('step #' + i);
  console.log(grid.map((l, y) => {
    return l.map((c, x) => {
      return (y === iptr[0] && x === iptr[1]) ? `[${c}]` : ` ${c} `;
    }).join('');
  }).join('\n'));
  console.log('');
  console.log('[' + stack.join(',') + ']');
  console.log('\'' + out + '\'');
  console.log('\n');
};

// machine definition

const norm = (grid) => {
  const dimy = grid.reduce((dimy, row) => {
    return row.length > dimy ? row.length : dimy;
  }, 0);

  const norm = grid.map(row => {
    row = row.slice(); // copy row
    while (row.length < dimy) row.push(' ');
    return row;
  });

  return norm;
};

const interpret = (code) => {
  const grid = norm(code.split('\n').map(l => l.split(''))); // make 2-d array

  const right = [ 0,  1];
  const left  = [ 0, -1];
  const down  = [ 1,  0];
  const up    = [-1,  0];

  let iptr = [0, 0]; // instruction pointer [y, x] (into grid)
  let movm = right;  // iptr movement vector [dy, dx]

  const move = () => {
    const dimy = grid.length, dimx = grid[iptr[0]].length;
    iptr[1] = (iptr[1] + movm[1] + dimx) % dimx;
    iptr[0] = (iptr[0] + movm[0] + dimy) % dimy;
  };

  const stack = [];
  let out = '';

  let stringmode = false;

  const m = {
    '+': () => { const a = stack.pop(), b = stack.pop(); stack.push(b + a); },
    '-': () => { const a = stack.pop(), b = stack.pop(); stack.push(b - a); },
    '*': () => { const a = stack.pop(), b = stack.pop(); stack.push(b * a); },
    '/': () => {
      const a = stack.pop(), b = stack.pop();
      stack.push(a === 0 ? 0 : Math.round(b / a));
    },
    '%': () => {
      const a = stack.pop(), b = stack.pop();
      stack.push(a === 0 ? 0 : Math.round(b % a));
    },
    '!': () => { const a = stack.pop(); stack.push(a === 0 ? 1 : 0 ); },
    '`': () => {
      const a = stack.pop(), b = stack.pop();
      stack.push(b > a ? 1 : 0);
    },
    '>': () => { movm = right; },
    '<': () => { movm = left; },
    '^': () => { movm = up; },
    'v': () => { movm = down; },
    '?': () => {
      movm = [right, left, down, up][Math.floor(Math.random() * 4)];
    },
    '_': () => { const a = stack.pop(); movm = a === 0 ? right : left; },
    '|': () => { const a = stack.pop(); movm = a === 0 ? down : up; },
    '"': () => { stringmode = !stringmode; },
    ':': () => {
      if (stack.length === 0) {
        stack.push(0)
      } else {
        const a = stack.pop();
        stack.push(a);
        stack.push(a);
      }
    },
    '\\': () => {
      const a = stack.pop(), b = stack.pop() || 0;
      stack.push(a);
      stack.push(b);
    },
    '$': () => { stack.pop(); },
    '.': () => { out += '' + stack.pop(); },
    ',': () => { out += String.fromCharCode(stack.pop()); },
    '#': () => { move(); },
    'p': () => {
      const y = stack.pop(), x = stack.pop(), v = stack.pop();
      grid[y][x] = String.fromCharCode(v);
    },
    'g': () => {
      const y = stack.pop(), x = stack.pop(), v = grid[y][x];
      stack.push(typeof v === 'undefined' ? 0 : v.charCodeAt(0));
    },
    ' ': () => {}
  };
  for (let i = 0; i < 10; i++) m['' + i] = () => stack.push(i);

  const exec = (opcode) => {
    if (stringmode && opcode !== '"') return stack.push(opcode.charCodeAt(0));
    if (!m[opcode]) throw new Error('INVALID OPCODE: ' + opcode);
    const cmd = m[opcode];
    return cmd();
  };

  let i = 0;

  while (true) {
    let opcode = grid[iptr[0]][iptr[1]];
    if (opcode === '@') break;
    exec(opcode);
    move();

    // debug(++i, grid, iptr, movm, stack, out);
  }

  return out;
};

// --

const c = (lines) => lines.join('\n');

console.log(interpret(c([
  '>987v>.v',
  'v456<  :',
  '>321 ^ _@'
])));

console.log(interpret(c([
  '08>:1-:v v *_$.@ ',
  '  ^    _$>\\:^    '
])));

console.log(interpret(c([
  '>              v',
  'v  ,,,,,"Hello"<',
  '>48*,          v',
  'v,,,,,,"World!"<',
  '>25*,@'
])));
