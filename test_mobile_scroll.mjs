import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3001';

async function testMobileScroll() {
  console.log('Starting mobile scroll test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to musicas list
    console.log('1. Navigating to /musicas...');
    await page.goto(`${BASE_URL}/musicas`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check if page loaded
    const title = await page.title();
    console.log('   Page title:', title);
    
    // Get all musicas links excluding /new and /edit
    const allLinks = await page.$$('a[href^="/musicas/"]');
    const filteredLinks = [];
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.includes('/new') && !href.includes('/edit') && /\/musicas\/\d+/.test(href)) {
        filteredLinks.push(link);
      }
    }
    console.log('   Found', filteredLinks.length, 'song links (excluding /new and /edit)');
    
    if (filteredLinks.length > 0) {
      // Click first song
      console.log('2. Clicking first song...');
      const href = await filteredLinks[0].getAttribute('href');
      console.log('   Navigating to:', href);
      await page.goto(BASE_URL + href, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('   URL:', page.url());
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Get page content to check structure
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      console.log('3. Page metrics:');
      console.log('   Body scroll height:', bodyHeight);
      console.log('   Viewport height:', viewportHeight);
      console.log('   Can scroll:', bodyHeight > viewportHeight);
      
      // Check overflow properties
      console.log('4. Checking overflow properties...');
      const htmlOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.documentElement).overflow;
      });
      const bodyOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow;
      });
      console.log('   html overflow:', htmlOverflow);
      console.log('   body overflow:', bodyOverflow);
      
      // Find scroll container
      console.log('5. Finding scroll container...');
      const scrollContainer = await page.$('div[class*="overflow-auto"], div[class*="overflow-y-auto"], [class*="cifra"], main, article');
      
      if (scrollContainer) {
        const box = await scrollContainer.boundingBox();
        console.log('   Found scroll container:', JSON.stringify(box));
        
        // Check scroll metrics
        const scrollInfo = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          return {
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollTop: el.scrollTop,
            overflow: window.getComputedStyle(el).overflow,
            overflowY: window.getComputedStyle(el).overflowY,
            flexShrink: window.getComputedStyle(el).flexShrink,
          };
        }, 'div[class*="overflow-auto"], div[class*="overflow-y-auto"]');
        
        console.log('   Scroll info:', JSON.stringify(scrollInfo, null, 2));
        
        // Try programmatic scroll
        await page.evaluate(() => {
          const el = document.querySelector('div[class*="overflow-auto"], div[class*="overflow-y-auto"]');
          if (el) {
            el.scrollTop = 100;
            console.log('Set scrollTop to 100');
          } else {
            window.scrollTo(0, 100);
            console.log('Used window.scrollTo');
          }
        });
        
        const newScrollTop = await page.evaluate(() => {
          const el = document.querySelector('div[class*="overflow-auto"], div[class*="overflow-y-auto"]');
          return el ? el.scrollTop : window.scrollY;
        });
        console.log('   Scroll top after scroll:', newScrollTop);
        
        // Check the main content wrapper
        const mainContent = await page.evaluate(() => {
          const main = document.querySelector('main') || document.querySelector('[class*="flex-col"]');
          if (!main) return null;
          const style = window.getComputedStyle(main);
          return {
            overflow: style.overflow,
            height: style.height,
            minHeight: style.minHeight,
            display: style.display,
            flexDirection: style.flexDirection,
          };
        });
        console.log('   Main content:', JSON.stringify(mainContent, null, 2));
        
        console.log('6. SUCCESS: Mobile scroll test completed!');
        
      } else {
        console.log('   No scroll container found');
        console.log('   Checking body/html overflow...');
        console.log('   html overflow:', htmlOverflow);
        console.log('   body overflow:', bodyOverflow);
      }
      
    } else {
      console.log('   No songs found. Checking API...');
      const response = await page.request.get(`${BASE_URL}/api/musicas`);
      const musicas = await response.json();
      console.log('   API returned', Array.isArray(musicas) ? musicas.length : 0, 'musicas');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testMobileScroll();
