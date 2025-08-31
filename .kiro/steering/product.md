# Product Overview

AI News Aggregator is a web application that automatically collects, summarizes, and provides AI-related news in both Japanese and English.

## Core Features
- Automated RSS news collection from multiple sources
- AI-powered content summarization using Claude
- Bilingual support (Japanese/English)
- Daily trend analysis and reporting
- JSON data output for frontend consumption

## Target Sources
- O'Reilly Radar
- Reddit (MachineLearning, artificial)
- TechCrunch AI
- Other AI/ML focused RSS feeds

## Architecture
- Backend: Python data processing pipeline
- AI: Anthropic Claude for summarization
- Frontend: Next.js (planned)
- Deployment: Docker containerized
- Data: JSON files for frontend consumption

## Key Workflows
1. RSS collection from configured sources
2. Content processing and AI summarization
3. Translation between Japanese/English
4. Trend analysis and daily summaries
5. JSON output generation for web frontend