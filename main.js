const data = require('./data');

class CurrencyPairConverter {
  constructor(data) {
    const pairs = this.convertToPairs(data);
    this.graph = this.buildGraph(pairs);
    this.pairs = this.buildPairsMap(data);
  }

  convertToPairs(data) {
    return data.map(x => x.currencyPair).map(x => ({a: x.substr(0, 3), b: x.substr(3, 3)}));
  }

  buildGraph(pairs) {
    const graph = new Map();
    const addKeyToMap = (a, b, pair) => {
      const v = {ccy: b, pair};
      if (graph.has(a)) {
        const arr = graph.get(a);
        arr.push(v);
        graph.set(a, arr);
      } else {
        graph.set(a, [v]);
      }
    };
    pairs.forEach(({a, b}) => addKeyToMap(a, b, a + b));
    pairs.forEach(({a, b}) => addKeyToMap(b, a, a + b));
    return graph;
  }

  buildPairsMap(pairs) {
    const map = new Map();
    pairs.forEach(({currencyPair, bid, ask}) => {
      map.set(currencyPair, {bid, ask});
    })
    return map;
  }

  convert(ccy1, ccy2, amount, bidask) {
    const rate = this.getRate(ccy1, ccy2, bidask);
    return (rate * amount).toFixed(6);
  }

  getRate(ccy1, ccy2, bidask) {
    const shortestPath = this.getShortestPath(ccy1, ccy2);
    return shortestPath.map(({ccy, pair}) => {
      if (this.isBaseCurrency(ccy, pair)) {
        return this.pairs.get(pair)[bidask];
      } else {
        return 1 / this.pairs.get(pair)[bidask];
      }
    })
    .reduce((a, b) => a * b);
  }

  isBaseCurrency(ccy, pair) {
    return ccy === pair.substr(0, 3);
  }

  getShortestPath(from, to) {
    const dfs = this.dfs(from, to);
    const visited = new Map();
    const shortestPath = [];
    let current = {ccy: to, pair: '?'};
    while (current) {
        if (visited.has(current.ccy)) {
          continue;
        }
        visited.set(current.ccy, true);
        shortestPath.push(current);
        if (current.ccy === from) {
          break;
        }
        const arr = this.graph.get(current.ccy);
        current = arr.reduce((a, b) => {
          if (!dfs.has(a.ccy)) {
            return b;
          }
          if (!dfs.has(b.ccy)) {
            return a;
          }
          if (dfs.get(a.ccy) < dfs.get(b.ccy)) {
            return a;
          }
          return b;
        });
    }
    shortestPath.reverse();
    shortestPath.pop();
    return shortestPath;
  }

  dfs(from, to) {
    const visited = new Map();
    const stack = [];
    stack.push({item: from, level: 0});
    while (stack.length > 0) {
      const {item, level} = stack.pop();
      if (visited.has(item)) {
        continue;
      }
      visited.set(item, level);
      if (item === to) {
        break;
      }
      const arr = this.graph.get(item);
      arr.forEach(({ccy, pair}) => {
        stack.push({item: ccy, level: level + 1});
      });
    }
    if (stack.length === 0) {
      throw new Error("There is no path");
    }
    return visited;
  }
}


const converter = new CurrencyPairConverter(data);
console.log(converter.convert('TRY', 'CAD', 1, 'ask'));
