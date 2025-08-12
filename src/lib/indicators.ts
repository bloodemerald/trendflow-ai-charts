import { ChartData } from '../store/chartStore';

// Calculate RSI
export const calculateRSI = (data: ChartData[], period = 14) => {
  const rsiValues: { time: number; value: number }[] = [];
  if (data.length < period) return rsiValues;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let gain = 0;
    let loss = 0;

    if (change > 0) {
      gain = change;
    } else {
      loss = -change;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    rsiValues.push({ time: data[i].timestamp, value: rsi });
  }

  return rsiValues;
};

// Calculate SMA for MACD
const calculateSMA = (data: number[], period: number) => {
  const sma: number[] = [];
  for (let i = 0; i <= data.length - period; i++) {
    const slice = data.slice(i, i + period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }
  return sma;
};

// Calculate MACD
export const calculateMACD = (data: ChartData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const macdValues: { time: number; macd: number; signal: number; histogram: number }[] = [];
  if (data.length < slowPeriod) return macdValues;

  const closePrices = data.map(d => d.close);

  const ema = (prices: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    const emaValues = [ema];
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * k + ema;
      emaValues.push(ema);
    }
    return emaValues;
  };

  const fastEMA = ema(closePrices, fastPeriod);
  const slowEMA = ema(closePrices, slowPeriod);

  const macdLine = slowEMA.map((val, i) => fastEMA[i + (fastPeriod - slowPeriod)] - val);
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = signalLine.map((val, i) => macdLine[i + (macdLine.length - signalLine.length)] - val);

  for (let i = 0; i < histogram.length; i++) {
    const dataIndex = i + (data.length - histogram.length);
    macdValues.push({
      time: data[dataIndex].timestamp,
      macd: macdLine[i + (macdLine.length - histogram.length)],
      signal: signalLine[i],
      histogram: histogram[i],
    });
  }

  return macdValues;
};

// Calculate Bollinger Bands
export const calculateBollingerBands = (data: ChartData[], period = 20, stdDev = 2) => {
  const bbValues: { time: number; middle: number; upper: number; lower: number }[] = [];
  if (data.length < period) return bbValues;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map(d => d.close);
    const middle = closes.reduce((acc, val) => acc + val, 0) / period;
    const std = Math.sqrt(closes.map(x => Math.pow(x - middle, 2)).reduce((a, b) => a + b) / period);
    const upper = middle + std * stdDev;
    const lower = middle - std * stdDev;

    bbValues.push({ time: data[i].timestamp, middle, upper, lower });
  }

  return bbValues;
};
