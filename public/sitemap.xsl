<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" 
                exclude-result-prefixes="s">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap Command Center | PackSite</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            --bg-base: #080710;
            --bg-surface: #12111f;
            --bg-interactive: #1c1a2e;
            --border-glow: #3b2d54;
            --primary: #a78bfa;
            --primary-glow: #6d28d9;
            --accent: #22d3ee;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-base);
            color: var(--text-main);
            margin: 0;
            padding: 50px 20px;
          }

          .container {
            max-width: 1100px;
            margin: 0 auto;
          }

          /* HERO HEADER WITH GRADIENT */
          .header {
            position: relative;
            background: linear-gradient(135deg, #161129 0%, #0d091a 100%);
            border: 1px solid var(--border-glow);
            padding: 40px;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
            overflow: hidden;
          }

          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
            opacity: 0.35;
            pointer-events: none;
          }

          h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(to right, #c084fc, var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.025em;
          }

          p.subtitle {
            margin: 0;
            color: var(--text-muted);
            font-size: 15px;
            line-height: 1.6;
            max-width: 700px;
          }

          /* LIVE SEARCH BAR */
          .search-container {
            position: relative;
            margin-bottom: 25px;
          }

          .search-bar {
            width: 100%;
            box-sizing: border-box;
            background-color: var(--bg-surface);
            border: 1px solid var(--border-glow);
            padding: 16px 20px 16px 50px;
            border-radius: 12px;
            color: var(--text-main);
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }

          .search-bar:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.25);
          }

          .search-icon {
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 18px;
            pointer-events: none;
          }

          /* STATS GRID */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .stat-card {
            background-color: var(--bg-surface);
            border: 1px solid var(--border-glow);
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            transition: transform 0.2s ease;
          }

          .stat-card:hover {
            transform: translateY(-3px);
          }

          .stat-title {
            color: var(--text-muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 800;
            color: var(--text-main);
            margin-top: 10px;
          }

          .stat-value span {
            color: var(--accent);
          }

          /* RESPONSIVE TABLE */
          .table-wrapper {
            background-color: var(--bg-surface);
            border: 1px solid var(--border-glow);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }

          th {
            background-color: var(--bg-interactive);
            color: var(--text-main);
            padding: 18px 24px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.075em;
            font-weight: 700;
            border-bottom: 1px solid var(--border-glow);
          }

          td {
            padding: 18px 24px;
            border-bottom: 1px solid rgba(59, 45, 84, 0.4);
            font-size: 14px;
            vertical-align: middle;
          }

          tr:last-child td {
            border-bottom: none;
          }

          tr:hover td {
            background-color: rgba(167, 139, 250, 0.03);
          }

          .url-path {
            font-weight: 600;
            color: var(--primary);
            text-decoration: none;
            transition: color 0.15s ease;
            word-break: break-all;
          }

          .url-path:hover {
            color: var(--accent);
            text-decoration: underline;
          }

          /* PRIORITY PROGRESS BAR BAR */
          .priority-cell {
            min-width: 140px;
          }

          .priority-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .progress-bar-bg {
            flex-grow: 1;
            height: 6px;
            background-color: var(--bg-interactive);
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(to right, var(--primary), var(--accent));
            border-radius: 3px;
          }

          .priority-number {
            font-family: monospace;
            font-weight: 700;
            font-size: 13px;
            color: var(--text-main);
          }

          /* FREQUENCY STATUS CHIPS */
          .freq-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .freq-daily {
            background-color: rgba(34, 211, 238, 0.1);
            color: var(--accent);
            border: 1px solid rgba(34, 211, 238, 0.2);
          }

          .freq-weekly {
            background-color: rgba(167, 139, 250, 0.1);
            color: var(--primary);
            border: 1px solid rgba(167, 139, 250, 0.2);
          }

          .freq-monthly {
            background-color: rgba(107, 114, 128, 0.1);
            color: var(--text-muted);
            border: 1px solid rgba(107, 114, 128, 0.2);
          }

          .freq-yearly {
            background-color: rgba(239, 68, 68, 0.1);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }

          .date-cell {
            color: var(--text-muted);
            font-family: monospace;
          }

          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 13px;
            color: var(--text-muted);
          }

          .no-results {
            display: none;
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
            font-size: 16px;
          }

          @media (max-width: 768px) {
            th:nth-child(3), td:nth-child(3),
            th:nth-child(4), td:nth-child(4) {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- HERO HEADER -->
          <div class="header">
            <h1>Sitemap Index Dashboard</h1>
            <p class="subtitle">This dashboard displays the crawl priority paths configured for search engines and Google AdSense on your live application.</p>
          </div>

          <!-- STATISTICS HERO ROW -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total URLs Mapped</div>
              <div class="stat-value" id="url-count">
                <xsl:value-of select="count(s:urlset/s:url)"/>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-title">High Priority (≥ 0.8)</div>
              <div class="stat-value">
                <span><xsl:value-of select="count(s:urlset/s:url[s:priority >= 0.8])"/></span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Format Compatibility</div>
              <div class="stat-value" style="color: #34d399;">XML 0.9</div>
            </div>
          </div>

          <!-- SEARCH TOOL -->
          <div class="search-container">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" onkeyup="filterSitemap()" class="search-bar" placeholder="Search paths, frequencies, dates..." autofocus="autofocus" />
          </div>

          <!-- TABLE CONTAINER -->
          <div class="table-wrapper">
            <table id="sitemap-table">
              <thead>
                <tr>
                  <th>Target URL</th>
                  <th>Crawl Priority</th>
                  <th>Change Frequency</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <!-- URL Path Column -->
                    <td>
                      <a class="url-path" href="{s:loc}">
                        <xsl:value-of select="s:loc"/>
                      </a>
                    </td>
                    
                    <!-- Priority visual progress meter Column -->
                    <td class="priority-cell">
                      <div class="priority-container">
                        <div class="progress-bar-bg">
                          <div class="progress-bar-fill" style="width: {s:priority * 100}%"></div>
                        </div>
                        <span class="priority-number"><xsl:value-of select="s:priority"/></span>
                      </div>
                    </td>
                    
                    <!-- Freq badge Column -->
                    <td>
                      <span class="freq-badge freq-{s:changefreq}">
                        <xsl:value-of select="s:changefreq"/>
                      </span>
                    </td>
                    
                    <!-- Modified Date Column -->
                    <td class="date-cell">
                      <xsl:value-of select="s:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
            <div id="no-results-msg" class="no-results">
              No matching pages found in sitemap directory.
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            Powered by PackSite | Serviced at <a href="https://packsite.vercel.app/" style="color: var(--accent);">packsite.vercel.app</a>
          </div>
        </div>

        <!-- SEARCH JS SCRIPT -->
        <script>
          <![CDATA[
          function filterSitemap() {
            var input = document.getElementById('search-input');
            var filter = input.value.toLowerCase();
            var table = document.getElementById('sitemap-table');
            var tr = table.getElementsByTagName('tr');
            var noResults = document.getElementById('no-results-msg');
            var visibleCount = 0;

            for (var i = 1; i < tr.length; i++) {
              var tdPath = tr[i].getElementsByTagName('td')[0];
              var tdFreq = tr[i].getElementsByTagName('td')[2];
              var tdDate = tr[i].getElementsByTagName('td')[3];
              
              if (tdPath) {
                var pathText = tdPath.textContent || tdPath.innerText;
                var freqText = tdFreq ? (tdFreq.textContent || tdFreq.innerText) : '';
                var dateText = tdDate ? (tdDate.textContent || tdDate.innerText) : '';
                
                var match = pathText.toLowerCase().indexOf(filter) > -1 || 
                            freqText.toLowerCase().indexOf(filter) > -1 ||
                            dateText.toLowerCase().indexOf(filter) > -1;
                            
                if (match) {
                  tr[i].style.display = "";
                  visibleCount++;
                } else {
                  tr[i].style.display = "none";
                }
              }
            }
            
            // Show / hide no results layout
            if (visibleCount === 0) {
              noResults.style.display = "block";
            } else {
              noResults.style.display = "none";
            }

            // Dynamically update counter
            document.getElementById('url-count').innerText = visibleCount;
          }
          ]]>
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>