#!/usr/bin/env python3
"""Convert FinQuest markdown documentation to PDF."""

import sys
import os

# Use backend venv packages
sys.path.insert(0, "/home/israel/Desktop/funke final year projuct/app/backend/venv/lib/python3.13/site-packages")

import markdown
from weasyprint import HTML, CSS

MARKDOWN_FILE = "/home/israel/Desktop/funke final year projuct/FINQUEST_DOCUMENTATION.md"
OUTPUT_PDF = "/home/israel/Desktop/funke final year projuct/FinQuest_Documentation.pdf"

CSS_STYLES = """
@page {
    size: A4;
    margin: 2.5cm 2cm 2.5cm 2cm;
    @bottom-center {
        content: "FinQuest Documentation — Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #666;
        font-family: 'Inter', sans-serif;
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 10.5pt;
    line-height: 1.6;
    color: #1e293b;
    background: white;
}

/* Typography */
h1 {
    font-size: 24pt;
    font-weight: 700;
    color: #1e3a8a;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 0.3em;
    margin-top: 0;
    margin-bottom: 0.6em;
    page-break-after: avoid;
}

h2 {
    font-size: 16pt;
    font-weight: 600;
    color: #1e40af;
    border-bottom: 1.5px solid #bfdbfe;
    padding-bottom: 0.2em;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #2563eb;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
}

h4 {
    font-size: 11pt;
    font-weight: 600;
    color: #334155;
    margin-top: 1em;
    margin-bottom: 0.3em;
}

p {
    margin: 0.5em 0;
    text-align: justify;
}

/* Links */
a {
    color: #2563eb;
    text-decoration: none;
}

/* Code blocks */
pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    font-size: 8.5pt;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0.8em 0;
    page-break-inside: avoid;
}

code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 9pt;
    background: #f1f5f9;
    padding: 1px 4px;
    border-radius: 3px;
    color: #0f172a;
}

pre code {
    background: none;
    padding: 0;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
}

th {
    background: #eff6ff;
    color: #1e40af;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border-bottom: 2px solid #3b82f6;
}

td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
}

tr:nth-child(even) {
    background: #f8fafc;
}

/* Lists */
ul, ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
}

li {
    margin: 0.2em 0;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #3b82f6;
    margin: 1em 0;
    padding: 0.5em 1em;
    background: #eff6ff;
    border-radius: 0 6px 6px 0;
}

/* Horizontal rules */
hr {
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 1.5em 0;
}

/* TOC styling */
#table-of-contents {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1em 1.5em;
    margin-bottom: 2em;
}

#table-of-contents ul {
    list-style: none;
    padding-left: 0;
}

#table-of-contents li {
    padding: 0.15em 0;
}

#table-of-contents a {
    color: #334155;
}

/* Cover page */
.cover-title {
    text-align: center;
    margin-top: 4cm;
}

.cover-title h1 {
    font-size: 32pt;
    border: none;
    color: #1e3a8a;
}

.cover-subtitle {
    text-align: center;
    font-size: 14pt;
    color: #64748b;
    margin-top: 1em;
}

.cover-meta {
    text-align: center;
    font-size: 10pt;
    color: #94a3b8;
    margin-top: 3em;
}

/* Status badges */
.status-complete {
    display: inline-block;
    background: #dcfce7;
    color: #166534;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 600;
}

/* Page breaks */
.page-break {
    page-break-before: always;
}
"""

EXTENSIONS = [
    'toc',
    'tables',
    'fenced_code',
    'codehilite',
    'nl2br',
]


def main():
    print("Reading markdown...")
    with open(MARKDOWN_FILE, 'r', encoding='utf-8') as f:
        md_content = f.read()

    print("Converting markdown to HTML...")
    md = markdown.Markdown(extensions=EXTENSIONS)
    html_body = md.convert(md_content)

    # Wrap in full HTML document
    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FinQuest Documentation</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
{html_body}
</body>
</html>"""

    print("Generating PDF...")
    HTML(string=html_doc).write_pdf(
        OUTPUT_PDF,
        stylesheets=[CSS(string=CSS_STYLES)]
    )

    file_size = os.path.getsize(OUTPUT_PDF)
    print(f"Done! PDF saved to: {OUTPUT_PDF}")
    print(f"File size: {file_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
