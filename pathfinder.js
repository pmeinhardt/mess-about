'use strict';

// Mess with: A* search algo, binary heaps and priority queues
// in order to find a (short) path through a map.

const solve = (map, start, dest) => {
  // The map is a 2-dimensional array, an array of columns.
  // Each element represents a square:
  // - true for free squares,
  // - false for walls.

  // Define map and direction utilities

  const free = (x, y) => map[x] ? !!map[x][y] : false;

  const up    = [ 0, -1];
  const right = [ 1,  0];
  const down  = [ 0,  1];
  const left  = [-1,  0];

  const dir = (vec) => (vec[0] === 0
    ? (vec[1] === 1 ? 'down' : 'up')
    : (vec[0] === 1 ? 'right' : 'left')
  );

  const options = (x, y) => ([up, right, down, left]
    .map(d => [x + d[0], y + d[1]])
    .filter(c => free(c[0], c[1]))
  );

  // A* path finding
  //
  // Based on cost function f for each node n: f(n) = g(n) + h(n)
  // where g(n) = steps taken from start to n (actual)
  // and   h(n) = euclid. distance from n to dest (heuristic).

  const node = (x, y, f, g, pred) => ({x: x, y: y, f: f, g: g, pred: pred});

  const traceback = (end) => {
    let current = end;
    const path = [];

    while (current.pred) {
      const pred = current.pred;
      const delta = [current.x - pred.x, current.y - pred.y];
      path.unshift(dir(delta));
      current = current.pred;
    }

    return path;
  };

  const h = (x, y) => Math.sqrt(Math.pow(dest.x-x, 2) + Math.pow(dest.y-y, 2));

  const xy2str = (k) => k[0] + ',' + k[1]; // [x, y] => '${x},${y}'

  const openq = new PriorityQueue((a, b) => b.f - a.f); // lookup by min. cost
  const openm = new MapMap(xy2str); // lookup and set by x,y

  const closed = new MapMap(xy2str);

  const ini = node(start.x, start.y, h(start.x, start.y), 0, null);

  openq.queue(ini);
  openm.set([ini.x, ini.y], ini);

  while (openq.length() > 0) {
    // 1. get most promising candidate from open
    // 2. if candidate == dest: found a path, trace back path and return!
    // 3. remove candidate from open, add to closed
    // 4. check each possible candidate neighbor
    //   1. if neighbor in closed, continue with next candidate!
    //   2. check if neighbor in open:
    //     a. if yes: update open node if this is a better path
    //     b. else: add to open (new node discovered)

    const cand = openq.dequeue();

    if (cand.x === dest.x && cand.y === dest.y) return traceback(cand);

    closed.set([cand.x, cand.y], cand);

    options(cand.x, cand.y).forEach(pos => {
      const x = pos[0];
      const y = pos[1];

      if (closed.has([x, y])) return;

      const g = cand.g + 1;
      const n = node(x, y, g + h(x, y), g, cand);

      const ex = openm.get([x, y]);

      if (ex) {
        if (n.f < ex.f) {
          openm.set([x, y], n);
        }
      } else {
        openm.set([x, y], n);
        openq.queue(n);
      }
    });
  }

  return null;
};

// Data structures

const cmpswap = (arr, i, j, compare) => {
  const a = arr[i];
  const b = arr[j];

  const c = compare(a, b);

  if (c > 0) {
    arr[i] = b;
    arr[j] = a;
    return true;
  }

  return false;
};

const swap = (arr, i, j) => {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
};

function BinaryHeap(compare) {
  this.compare = compare || ((a, b) => a - b);
  this.data = [];
}

BinaryHeap.prototype.push = function (value) {
  const compare = this.compare;
  const data = this.data;

  data.push(value); // add to heap bottom level

  // now bubble up the inserted element

  const parent = (i) => (i - 1) >>> 1;

  let i = data.length - 1; // inserted index
  let p = parent(i);

  while (i > 0 && cmpswap(data, p, i, compare)) {
    i = p;
    p = parent(i);
  }
};

BinaryHeap.prototype.peek = function () {
  return this.data[0];
};

BinaryHeap.prototype.pop = function () {
  const compare = this.compare;
  const data = this.data;

  const ret = data[0];
  const last = data.pop();

  const len = data.length;

  if (len === 0) return ret;

  data[0] = last; // move last to top

  // bubble down top element (swap against larger child)

  const left = (i) => (i << 1) + 1;
  const right = (i) => (i << 1) + 2;

  let i = 0;

  while (true) {
    const l = left(i);
    const r = right(i);

    let max = i;

    if (l < len && data[l] > data[max]) max = l;
    if (r < len && data[r] > data[max]) max = r;

    if (max === i) break;

    swap(data, i, max);
    i = max;
  }

  return ret;
};

BinaryHeap.prototype.clear = function () {
  this.length = 0;
  this.data = [];
};

BinaryHeap.prototype.size = function () {
  return this.data.length;
};

function PriorityQueue(compare) {
  this.data = new BinaryHeap(compare);
}

PriorityQueue.prototype.peek = function () {
  return this.data.peek();
};

PriorityQueue.prototype.queue = function (value) {
  return this.data.push(value);
};

PriorityQueue.prototype.dequeue = function () {
  return this.data.pop();
};

PriorityQueue.prototype.clear = function () {
  return this.data.clear();
};

PriorityQueue.prototype.length = function () {
  return this.data.size();
};

// Apparantly Map cannot be extended via prototypal inheritance,
// as the spec disallows the Map constructor to be called as a function.
// In particular, `Map.call(this)` (a call to the super constructor)
// will throw an exception.
//
// See http://www.ecma-international.org/ecma-262/6.0/#sec-map-constructor
//
// Class-inheritance using `super()` will work however.

class MapMap extends Map {
  constructor(keytransform) {
    super();
    this.keytransform = keytransform;
  }

  set(k, v) {
    return super.set(this.keytransform(k), v);
  }

  has(k) {
    return super.has(this.keytransform(k));
  }

  get(k) {
    return super.get(this.keytransform(k));
  }

  delete(k) {
    return super.delete(this.keytransform(k));
  }
}

// --

let map;

map = [
  [true,  true,  true],
  [false, false, true],
  [true,  true,  true]
];

console.log(solve(map, {x: 0, y: 0}, {x: 2, y: 0}));

map = [
  [true,  true,  false, false, false],
  [false, true,  true,  false, false],
  [false, false, true,  true,  false],
  [false, false, false, true,  true ],
  [false, false, false, false, true ]
];

console.log(solve(map, {x: 0, y: 0}, {x: 4, y: 4}));

map = [
  [true,  true,  true,  false, true ],
  [false, false, true,  false, true ],
  [true,  true,  true,  true,  true ],
  [true,  false, true,  false, false],
  [false, true,  true,  true,  true ]
];

console.log(solve(map, {x: 0, y: 0}, {x: 4, y: 4}));
