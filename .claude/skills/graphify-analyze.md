---
name: graphify-analyze
description: Analyze project structure with Graphify
---

# Graphify Project Analysis

Use Graphify to analyze the project structure, dependencies, and architecture.

## How to use

```bash
cd .graphify && npm install && npm run analyze ../
```

This will:
- Analyze the project structure
- Generate dependency graphs
- Create architecture visualizations
- Save results to `graphify-output/`

## Output files
- `graphify-output/graph.json` - Dependency graph
- `graphify-output/architecture.html` - Visual architecture
- `graphify-output/report.md` - Analysis report

## Important
- Results are cached in `graphify-cache/`
- All Graphify files are gitignored
- Never commit output files to the repository
