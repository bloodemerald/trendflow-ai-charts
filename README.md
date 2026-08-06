# TrendFlow AI Charts

An interactive market-analysis dashboard that combines lightweight financial charts with Gemini-powered technical analysis.

## Overview

TrendFlow gives traders a single workspace for exploring price action, reviewing market summaries, and asking an AI assistant to analyze recent candle data. The interface is built around a TradingView-style chart, watchlist controls, technical metrics, and a dedicated analysis panel.

> This project is an experimental analysis tool. It does not provide financial advice or guarantee trading outcomes.

## Features

- Interactive candlestick charts powered by Lightweight Charts
- Market summary with OHLC, price change, and volume data
- Moving-average calculations and technical indicator panels
- Gemini AI analysis of recent chart data and conversation context
- Responsive trading-terminal layout
- Local client-side state management
- Automated tests with Vitest

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- Lightweight Charts
- Zustand
- TanStack Query
- Google Gemini API
- Vitest

## Getting Started

### Requirements

- Node.js 18 or newer
- npm
- A Gemini API key

### Installation

```bash
git clone https://github.com/bloodemerald/trendflow-ai-charts.git
cd trendflow-ai-charts
npm install
cp .env.example .env.local
```

Add your Gemini key to `.env.local`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Start the development server:

```bash
npm run dev
```

## Available Scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run test      # Run the test suite
npm run preview   # Preview the production build
```

## Project Structure

```text
src/
├── components/    # Chart, navigation, panels, and reusable UI
├── pages/         # Application routes
├── services/      # Gemini analysis integration
├── store/         # Zustand state management
├── types/         # Shared TypeScript types
└── utils/         # Chart and indicator utilities
```

## Security

Do not commit API keys. Keep secrets in `.env.local`, which should remain excluded from version control. Keys exposed in a public commit should be revoked immediately, even after the current source file is fixed, because Git history may still contain the old value.

## Roadmap

- Add more computed technical indicators
- Improve live market-data integrations
- Add saved layouts and analysis sessions
- Expand test coverage
- Add configurable AI providers

## License

This repository does not currently include a license file. Add one before distributing or accepting outside contributions.
