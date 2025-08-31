# AI News Aggregator Frontend

This is the frontend application for the AI News Aggregator, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Next.js 14** with TypeScript support
- **Tailwind CSS** for styling
- **Internationalization (i18n)** support for Japanese and English
- **Responsive design** with mobile-first approach
- **Static site generation** for optimal performance
- **Component-based architecture** with reusable layout components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
```

This will create an optimized production build in the `out` directory.

### Export

```bash
npm run export
```

This will build and export the application as static files.

## Project Structure

```
src/
├── components/
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Layout.tsx
├── locales/
│   ├── ja/
│   │   ├── common.json
│   │   ├── news.json
│   │   └── summary.json
│   └── en/
│       ├── common.json
│       ├── news.json
│       └── summary.json
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── summary.tsx
│   └── categories.tsx
└── styles/
    └── globals.css
```

## Internationalization

The application supports both Japanese (default) and English languages. Translation files are located in `src/locales/` directory.

## Components

### Layout Components

- **Header**: Navigation bar with language switcher and responsive mobile menu
- **Footer**: Simple footer with copyright and attribution
- **Layout**: Main layout wrapper that combines Header and Footer

## Styling

The application uses Tailwind CSS for styling with a mobile-first responsive approach. Custom styles are defined in `src/styles/globals.css`.

## Configuration

- `next.config.js`: Next.js configuration with static export settings
- `tailwind.config.ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `next-i18next.config.js`: Internationalization configuration