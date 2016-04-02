'use strict';

// machine visualization and debugging utils

const repstr = (str, n) => {
  let res = '';
  for (let i = 0; i < n; i++) res += str;
  return res;
};

const lpad = (str, chr, n) => {
  let res = str;
  while (res.length < n) res = chr + res;
  return res;
};

const debug = (i, code, input, mem, iptr, dptr, out) => {
  console.log('step #' + i);
  console.log(code.join(''));
  console.log(repstr(' ', iptr) + '^');
  console.log('[' + mem.map(c => lpad(c.toString(10), ' ', 3)).join(',') + ']');
  console.log(repstr(' ', 1 + dptr * 4) + repstr('^', 3));
  console.log('\n');
};

// machine definition

const EOF = new Error('EOF'); // end-of-file (input)
const EOP = new Error('EOP'); // end-of-prog (read beyond program limits)

const interpret = (code, input) => {
  const mem = [0];

  let dptr = 0; // data pointer (into mem)
  let iptr = 0; // instruction pointer (into code)
  let out = ''; // output buffer

  code = code.split('');

  const stream = (input) => {
    let pos = 0;
    return () => {
      if (pos >= input.length) throw EOF;
      return input.charAt(pos++);
    };
  };

  const istream = stream(input);

  const ini = (ptr) => {
    if (typeof mem[ptr] === 'undefined') mem[ptr] = 0;
  };

  const read = (ptr) => String.fromCharCode(mem[ptr]);
  const store = (ptr, val) => mem[ptr] = val.charCodeAt(0);

  const m = {
    '>': () => { dptr++; ini(dptr); },
    '<': () => { dptr--; ini(dptr); },
    '+': () => { mem[dptr] = (mem[dptr] + 1) % 256; },
    '-': () => { mem[dptr] = (mem[dptr] + 255) % 256; },
    '.': () => { out += read(dptr); },
    ',': () => { store(dptr, istream()); },
    '[': () => {
      if (mem[dptr] === 0) {
        let opened = 1;
        while (opened > 0) {
          iptr++;
          if (code[iptr] === '[') opened++;
          if (code[iptr] === ']') opened--;
        }
      }
    },
    ']': () => {
      if (mem[dptr] !== 0) {
        let closed = 1;
        while (closed > 0) {
          iptr--;
          if (code[iptr] === '[') closed--;
          if (code[iptr] === ']') closed++;
        }
      }
    }
  };

  const step = () => {
    let opcode = code[iptr];
    if (typeof opcode === 'undefined') throw EOP;
    m[opcode]();
    iptr++;
  };

  let i = 0;

  while (true) {
    try {
      step();
      // debug(++i, code, input, mem, iptr, dptr, out);
    } catch (e) {
      if (e === EOF || e === EOP) break;
      else console.error(e);
    }
  }

  return out;
};

// --

console.log(interpret(',>,<[>[->+>+<<]>>[-<<+>>]<<<-]>>.', String.fromCharCode(8, 9)));

console.log(interpret(',>+>>>>++++++++++++++++++++++++++++++++++++++++++++>++++++++++++++++++++++++++++++++<<<<<<[>[>>>>>>+>+<<<<<<<-]>>>>>>>[<<<<<<<+>>>>>>>-]<[>++++++++++[-<-[>>+>+<<<-]>>>[<<<+>>>-]+<[>[-]<[-]]>[<<[>>>+<<<-]>>[-]]<<]>>>[>>+>+<<<-]>>>[<<<+>>>-]+<[>[-]<[-]]>[<<+>>[-]]<<<<<<<]>>>>>[++++++++++++++++++++++++++++++++++++++++++++++++.[-]]++++++++++<[->-<]>++++++++++++++++++++++++++++++++++++++++++++++++.[-]<<<<<<<<<<<<[>>>+>+<<<<-]>>>>[<<<<+>>>>-]<-[>>.>.<<<[-]]<<[>>+>+<<<-]>>>[<<<+>>>-]<<[<+>-]>[<+>-]<<<-]', String.fromCharCode(10)));
