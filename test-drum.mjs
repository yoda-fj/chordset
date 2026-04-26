import { chromium } from 'playwright'

async function test() {
  const browser = await chromium.launch({ headless: true })  
  const page = await browser.newPage()
  
  page.on('console', msg => {
    console.log('[Browser]', msg.type() + ':', msg.text())
  })
  
  page.on('pageerror', err => {
    console.log('[Page Error]:', err.message)
  })
  
  console.log('Navigating to drum-debug page...')
  await page.goto('http://localhost:3000/drum-debug', { waitUntil: 'networkidle', timeout: 30000 })
  
  await page.waitForTimeout(4000)
  
  const logsText = await page.$eval('textarea', el => el.value)
  console.log('\n=== Initial Logs ===')
  console.log(logsText || '(empty)')
  
  // Click Kick direct test
  console.log('\nClicking Kick button...')
  await page.click('button:has-text("Kick")')
  await page.waitForTimeout(500)
  
  const logsAfterKick = await page.$eval('textarea', el => el.value)
  console.log('\n=== After Kick ===')
  console.log(logsAfterKick)
  
  // Click PLAY
  console.log('\nClicking PLAY...')
  await page.click('button:has-text("▶ PLAY")')
  await page.waitForTimeout(2000)
  
  const logsAfterPlay = await page.$eval('textarea', el => el.value)
  console.log('\n=== After PLAY ===')
  console.log(logsAfterPlay)
  
  await browser.close()
  console.log('\nDone')
}

test().catch(e => {
  console.error('Test failed:', e.message)
  process.exit(1)
})