import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const baseUrl = "https://9animetv.to";

// Reuse browser instance across requests
let browserInstance: any = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
  }
  return browserInstance;
}

export async function POST(request: NextRequest) {
  let page: any = null;
  
  try {
    const { animeTitle, episode, slug } = await request.json();

    if (!animeTitle) {
      return NextResponse.json({ error: 'Missing animeTitle' }, { status: 400 });
    }

    const browser = await getBrowser();
    page = await browser.newPage();

    // Set a reasonable default timeout
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);

    // More aggressive blocking
    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
      const blockedResources = ['font', 'stylesheet', 'image', 'media', 'websocket', 'other'];
      const url = req.url();
      
      if (url.includes('devtool') || 
          url.includes('analytics') || 
          url.includes('tracking') ||
          url.includes('ads') ||
          url.includes('google-analytics')) {
        req.abort();
        return;
      }
      
      if (blockedResources.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    let animeSlug = slug;
    
    if (!animeSlug) {
      const searchUrl = `${baseUrl}/search?keyword=${encodeURIComponent(animeTitle)}`;
      console.log('Searching for:', animeTitle);
      
      try {
        // Use networkidle0 for better stability
        await page.goto(searchUrl, { 
          waitUntil: 'networkidle0', 
          timeout: 20000 
        });

        await page.waitForSelector('a[href*="/watch/"]', { timeout: 10000 });
        const href = await page.$eval('a[href*="/watch/"]', (el: any) => el.getAttribute('href'));
        
        if (href) {
          const match = href.match(/\/watch\/(.+)/);
          if (match) {
            animeSlug = match[1];
            console.log('Found slug:', animeSlug);
          }
        }
      } catch (error: any) {
        console.error('Search failed:', error.message);
        if (page) await page.close();
        return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
      }
    }

    if (!animeSlug) {
      if (page) await page.close();
      return NextResponse.json({ error: 'Could not extract anime slug' }, { status: 500 });
    }

    const url = `${baseUrl}/watch/${animeSlug}`;
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 20000 
      });
    } catch (error: any) {
      console.error('Failed to load anime page:', error.message);
      if (page) await page.close();
      return NextResponse.json({ error: 'Failed to load anime page' }, { status: 500 });
    }

    // Get episode list
    const episodes = [];
    try {
      await page.waitForFunction(() => {
        const elements = document.querySelectorAll('[data-number]');
        return elements.length > 0;
      }, { timeout: 15000 });
      
      const episodeData = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-number]');
        return Array.from(elements).map((el: any) => ({
          number: parseInt(el.getAttribute('data-number')),
          title: el.textContent?.trim() || `Episode ${el.getAttribute('data-number')}`,
          href: el.getAttribute('href')
        })).filter(ep => !isNaN(ep.number));
      });
      
      episodes.push(...episodeData);
      episodes.sort((a, b) => a.number - b.number);
      console.log(`Found ${episodes.length} episodes`);
    } catch (error: any) {
      console.error('Failed to get episodes:', error.message);
      if (page) await page.close();
      return NextResponse.json({ error: 'Failed to load episodes' }, { status: 500 });
    }

    if (!episode) {
      if (page) await page.close();
      return NextResponse.json({ episodes, slug: animeSlug });
    }

    // Find the episode
    const selectedEpisode = episodes.find(ep => ep.number === parseInt(episode));
    if (!selectedEpisode || !selectedEpisode.href) {
      if (page) await page.close();
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const episodeUrl = baseUrl + selectedEpisode.href;
    console.log('Loading episode:', episodeUrl);

    try {
      await page.goto(episodeUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 20000 
      });
    } catch (error: any) {
      console.error('Failed to load episode page:', error.message);
      if (page) await page.close();
      return NextResponse.json({ error: 'Failed to load episode page' }, { status: 500 });
    }

    // Get servers
    const servers = [];
    try {
      await page.waitForSelector("#servers-content > div.ps_-block.ps_-block-sub.servers-dub > div.ps__-list", { timeout: 10000 });
      
      const serverData = await page.evaluate(() => {
        const serverDivs = document.querySelectorAll("#servers-content > div.ps_-block.ps_-block-sub.servers-dub > div.ps__-list > div");
        return Array.from(serverDivs).slice(0, 3).map((div: any, i) => {
          const anchor = div.querySelector('a');
          return {
            name: anchor?.textContent?.trim() || `Server ${i+1}`,
            index: i
          };
        });
      });
      
      console.log(`Found ${serverData.length} servers`);

      // Process each server sequentially (more stable than parallel)
      for (const server of serverData) {
        try {
          // Click the server button
          await page.evaluate((index: number) => {
            const serverDivs = document.querySelectorAll("#servers-content > div.ps_-block.ps_-block-sub.servers-dub > div.ps__-list > div");
            const anchor = serverDivs[index]?.querySelector('a') as HTMLElement;
            if (anchor) anchor.click();
          }, server.index);
          
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for video to load
          
          // Get video source
          const videoSrc = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            if (iframe) return iframe.src;
            
            const video = document.querySelector('video');
            if (video) return (video as HTMLVideoElement).src;
            
            return '';
          });
          
          if (videoSrc) {
            servers.push({ name: server.name, url: videoSrc });
            console.log(`Got video URL for ${server.name}`);
          }
        } catch (error: any) {
          console.error(`Error processing ${server.name}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('Failed to get servers:', error.message);
    }

    if (page) await page.close();

    return NextResponse.json({ servers, episodes, slug: animeSlug });

  } catch (error: any) {
    console.error('Error:', error.message);
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    return NextResponse.json({ error: 'Failed to fetch video URL' }, { status: 500 });
  }
}

// Cleanup on process exit
process.on('exit', async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (e) {
      // Ignore
    }
  }
});