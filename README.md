# GEO Agent Cloud

This repository hosts the public GEO Agent Cloud workflow interface.

## Live Site

https://2707932128-hash.github.io/geo-agent-cloud/

## GEO Files

- `/llms.txt`
- `/robots.txt`
- `/schema.json`
- `/sitemap.xml`

## Deployment

GitHub Pages is deployed by `.github/workflows/deploy-pages.yml`.

## Daily Health Check

`.github/workflows/geo-health-check.yml` runs every day and verifies that the public home page and GEO machine-readable files return HTTP 200 with expected content.

The workflow uploads `reports/geo-health-check.json` as an artifact after every run.

## Current Scope

This is the public static layer of the GEO deployment workflow. The next product layer should add company configuration storage, scheduled crawl jobs, report history, and backend APIs.
