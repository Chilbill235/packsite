"use client";

import { useEffect, useRef } from "react";

export default function AdsterraBanner() {
  const banner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only inject if the div exists and is currently empty
    if (banner.current && !banner.current.firstChild) {
      const atOptions = {
        key: "YOUR_AD_KEY_HERE", // Replace with your actual Adsterra key
        format: "iframe",
        height: 50,
        width: 320,
        params: {},
      };

      const conf = document.createElement("script");
      const script = document.createElement("script");
      
      script.type = "text/javascript";
      script.src = `//www.profitabledisplaynetwork.com/${atOptions.key}/invoke.js`;
      
      conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;
      
      banner.current.append(conf);
      banner.current.append(script);
    }
  }, []);

  return (
    <div 
      ref={banner} 
      style={{ 
        height: 50, 
        width: 320, 
        margin: "1.25rem auto" 
      }} 
    />
  );
}