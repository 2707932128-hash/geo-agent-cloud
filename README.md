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

## Daily GEO Crawl

`.github/workflows/geo-daily-crawl.yml` runs every day at 10:15 China time and reads `data/company-config.json`.

It crawls the public site, `llms.txt`, `schema.json`, and sitemap pages, then uploads:

- `reports/geo-daily-crawl.json`
- `reports/geo-daily-crawl.md`

## Current Scope

This is the public static layer of the GEO deployment workflow. The next product layer should add company configuration storage, report history, user accounts, and private backend APIs.
