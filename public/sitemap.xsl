<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:sys="http://packsite.app/sys">
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>PackSite | Ops Command Center</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&amp;display=swap');
          
          /* Root Variables */
          :root {
            --bg: #050507;
            --card: rgba(18, 18, 22, 0.6);
            --accent: #8b5cf6;
            --glow: rgba(139, 92, 246, 0.4);
            --text: #f8fafc;
          }

          /* Entrance Animations */
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); } }

          body { 
            background: radial-gradient(circle at top right, #1a1533, #050507); 
            color: var(--text); 
            font-family: 'Inter', sans-serif; 
            padding: 40px; 
            margin: 0;
            animation: fadeIn 0.8s ease-out;
          }

          .container { display: grid; grid-template-columns: 300px 1fr; gap: 24px; max-width: 1400px; margin: 0 auto; }
          
          .card { 
            background: var(--card); 
            backdrop-filter: blur(16px); 
            border: 1px solid rgba(255,255,255,0.05); 
            border-radius: 24px; 
            padding: 30px; 
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

          /* Interactive Table */
          tr { 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
            border-radius: 12px;
            cursor: pointer;
          }
          tr:hover { 
            background: rgba(139, 92, 246, 0.05); 
            transform: scale(1.01);
            border-left: 2px solid var(--accent);
          }

          .live-dot { 
            width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; 
            display: inline-block; margin-right: 8px;
            animation: pulse 2s infinite;
          }

          button {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white; border: none; padding: 10px 20px; border-radius: 8px;
            font-weight: 600; cursor: pointer; transition: 0.2s;
          }
          button:hover { filter: brightness(1.2); transform: scale(1.05); }

          input {
            width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
            padding: 16px; border-radius: 16px; color: white; outline: none;
            transition: border 0.3s;
          }
          input:focus { border-color: var(--accent); }
        </style>
      </head>
      <body>
        <h1 style="margin-bottom: 30px; font-weight: 800; letter-spacing: -1px;">PackSite <span style="color:var(--accent)">Control Center</span></h1>
        
        <div class="container">
          <div class="card">
            <div style="margin-bottom: 20px;"><span class="live-dot"></span> Live Index Active</div>
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">System Time</div>
            <div id="clock" style="font-size: 24px; font-weight: 800; margin-bottom: 20px;">00:00:00</div>
            
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Latency</div>
            <div style="font-size: 24px; font-weight: 800; color: var(--accent); margin-bottom: 20px;"><xsl:value-of select="/s:urlset/sys:telemetry/sys:latency"/></div>
            
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Node Assets</div>
            <div style="font-size: 24px; font-weight: 800;"><xsl:value-of select="/s:urlset/sys:telemetry/sys:packs"/></div>
          </div>
          
          <div class="card">
            <input type="text" id="liveSearch" placeholder="Search operational paths..." onkeyup="filterTable()"/>
            <table id="opsTable" style="width:100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="text-align: left; color: #94a3b8; font-size: 12px;">
                  <th style="padding: 10px;">OPERATIONAL PATH</th>
                  <th style="padding: 10px;">WEIGHT</th>
                  <th style="padding: 10px; text-align: right;">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 15px;"><a href="{s:loc}" style="color:white; text-decoration:none;"><xsl:value-of select="s:loc"/></a></td>
                    <td style="padding: 15px;"><span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px;"><xsl:value-of select="s:priority"/></span></td>
                    <td style="padding: 15px; text-align: right;"><button onclick="window.location='{s:loc}'">Launch</button></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>

        <script>
          <![CDATA[
          function filterTable() {
            let filter = document.getElementById('liveSearch').value.toLowerCase();
            let rows = document.querySelectorAll('#opsTable tbody tr');
            rows.forEach(row => row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none');
          }
          setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
          setInterval(() => window.location.reload(), 45000);
          ]]>
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>