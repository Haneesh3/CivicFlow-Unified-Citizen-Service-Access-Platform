import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { generateExcelReport, TestResult } from './excelReporter';

const results: TestResult[] = [];

async function runTest(name: string, fn: (driver: WebDriver) => Promise<void>, driver: WebDriver) {
  const startTime = Date.now();
  console.log(`\n🚀 Running E2E Test: [${name}]`);
  try {
    await fn(driver);
    results.push({
      name,
      module: 'Web',
      status: 'PASSED',
      durationMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    });
    console.log(`✅ Passed: [${name}]`);
  } catch (err: any) {
    results.push({
      name,
      module: 'Web',
      status: 'FAILED',
      durationMs: Date.now() - startTime,
      errorMessage: err.message,
      timestamp: new Date().toLocaleTimeString(),
    });
    console.error(`❌ Failed: [${name}] - Error: ${err.message}`);
  }
}

async function main() {
  console.log('🤖 Starting Selenium Web E2E Test Suite for CivicFlow (100 Test Cases)...');
  
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    // --- CATEGORY 1: NAVIGATION & ACCESSIBILITY (5 Tests) ---
    await runTest('1. Load Homepage', async (d) => {
      await d.get('http://localhost:3000');
      await d.wait(until.titleContains('CivicFlow'), 5000);
    }, driver);

    await runTest('2. Navigate to Login Page', async (d) => {
      await d.get('http://localhost:3000/login');
      await d.wait(until.elementLocated(By.xpath("//h3[text()='Welcome Back']")), 5000);
    }, driver);

    await runTest('3. Navigate to Register Page', async (d) => {
      await d.get('http://localhost:3000/register');
      await d.wait(until.elementLocated(By.xpath("//h3[text()='Create Account']")), 5000);
    }, driver);

    await runTest('4. Accessibility Check: Services Route', async (d) => {
      await d.get('http://localhost:3000/services');
      await d.wait(until.elementLocated(By.xpath("//h1[text()='Digital India Portal']")), 5000);
    }, driver);

    await runTest('5. Accessibility Check: Report Route', async (d) => {
      await d.get('http://localhost:3000/report');
      await d.wait(until.elementLocated(By.xpath("//h1[text()='Report Civic Issue']")), 5000);
    }, driver);

    // --- CATEGORY 2: USER LIFECYCLE & REGISTER (10 Tests) ---
    const users = Array.from({ length: 10 }, (_, i) => ({
      name: `Test User ${i + 1}`,
      email: `qa_tester_user_${Date.now()}_${i + 1}@example.com`,
      password: `UserPass123_${i + 1}`
    }));

    for (let i = 0; i < 10; i++) {
      const user = users[i];
      await runTest(`User Registration - ${i + 6}: ${user.name}`, async (d) => {
        await d.get('http://localhost:3000/register');
        const nameInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='Enter your full name']")), 5000);
        await nameInput.sendKeys(user.name);
        await d.findElement(By.xpath("//input[@placeholder='name@email.com']")).sendKeys(user.email);
        await d.findElement(By.xpath("//input[@placeholder='Minimum 6 characters']")).sendKeys(user.password);
        await d.findElement(By.xpath("//button[@type='submit']")).click();
        await d.wait(until.urlIs('http://localhost:3000/'), 8000);
        // Logout immediately to prepare for next test
        await d.get('http://localhost:3000/login');
      }, driver);
    }

    // --- CATEGORY 3: USER LOGIN VERIFICATION (10 Tests) ---
    for (let i = 0; i < 10; i++) {
      const user = users[i];
      await runTest(`User Login - ${i + 16}: ${user.email}`, async (d) => {
        await d.get('http://localhost:3000/login');
        const emailInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='name@email.com']")), 5000);
        await emailInput.sendKeys(user.email);
        await d.findElement(By.xpath("//input[@placeholder='••••••••']")).sendKeys(user.password);
        await d.findElement(By.xpath("//button[@type='submit']")).click();
        await d.wait(until.urlIs('http://localhost:3000/'), 8000);
        // Clean session
        await d.executeScript("localStorage.removeItem('token'); localStorage.removeItem('auth-storage');");
      }, driver);
    }

    // --- CATEGORY 4: EDGE CASE AUTHENTICATION (5 Tests) ---
    await runTest('26. Auth Edge Case: Duplicate Email registration', async (d) => {
      await d.get('http://localhost:3000/register');
      const nameInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='Enter your full name']")), 5000);
      await nameInput.sendKeys('Duplicate QA User');
      await d.findElement(By.xpath("//input[@placeholder='name@email.com']")).sendKeys(users[0].email);
      await d.findElement(By.xpath("//input[@placeholder='Minimum 6 characters']")).sendKeys('TesterPass123');
      await d.findElement(By.xpath("//button[@type='submit']")).click();
      await d.wait(until.elementLocated(By.xpath("//*[contains(text(), 'already exists') or contains(text(), 'failed')]")), 8000);
    }, driver);

    await runTest('27. Auth Edge Case: Incorrect password login', async (d) => {
      await d.get('http://localhost:3000/login');
      const emailInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='name@email.com']")), 5000);
      await emailInput.sendKeys(users[0].email);
      await d.findElement(By.xpath("//input[@placeholder='••••••••']")).sendKeys('WrongPassword123');
      await d.findElement(By.xpath("//button[@type='submit']")).click();
      await d.wait(until.elementLocated(By.xpath("//*[contains(text(), 'credentials') or contains(text(), 'failed')]")), 8000);
    }, driver);

    await runTest('28. Auth Edge Case: Non-existent email login', async (d) => {
      await d.get('http://localhost:3000/login');
      const emailInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='name@email.com']")), 5000);
      await emailInput.sendKeys('non_existent_email_999@example.com');
      await d.findElement(By.xpath("//input[@placeholder='••••••••']")).sendKeys('TesterPass123');
      await d.findElement(By.xpath("//button[@type='submit']")).click();
      await d.wait(until.elementLocated(By.xpath("//*[contains(text(), 'credentials') or contains(text(), 'failed')]")), 8000);
    }, driver);

    await runTest('29. Auth Edge Case: Case-Insensitive Email Login', async (d) => {
      await d.get('http://localhost:3000/login');
      const emailInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='name@email.com']")), 5000);
      await emailInput.sendKeys(users[0].email.toUpperCase());
      await d.findElement(By.xpath("//input[@placeholder='••••••••']")).sendKeys(users[0].password);
      await d.findElement(By.xpath("//button[@type='submit']")).click();
      await d.wait(until.urlIs('http://localhost:3000/'), 8000);
    }, driver);

    await runTest('30. Auth Edge Case: Short Password verification', async (d) => {
      await d.get('http://localhost:3000/register');
      const nameInput = await d.wait(until.elementLocated(By.xpath("//input[@placeholder='Enter your full name']")), 5000);
      await nameInput.sendKeys('Short Pass User');
      await d.findElement(By.xpath("//input[@placeholder='name@email.com']")).sendKeys('short_pass@example.com');
      await d.findElement(By.xpath("//input[@placeholder='Minimum 6 characters']")).sendKeys('123');
      await d.findElement(By.xpath("//button[@type='submit']")).click();
      await d.wait(until.elementLocated(By.xpath("//*[contains(text(), 'at least') or contains(text(), 'short') or contains(text(), 'Minimum')]")), 8000);
    }, driver);

    // Login for subsequent tests
    await driver.get('http://localhost:3000/login');
    const emailInput = await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='name@email.com']")), 5000);
    await emailInput.sendKeys(users[0].email);
    await driver.findElement(By.xpath("//input[@placeholder='••••••••']")).sendKeys(users[0].password);
    await driver.findElement(By.xpath("//button[@type='submit']")).click();
    await driver.wait(until.urlIs('http://localhost:3000/'), 8000);

    // --- CATEGORY 5: CIVIC ISSUE COMPLAINT SUBMISSIONS (40 Tests) ---
    const categories = [
      'Roads & Potholes',
      'Garbage & Sanitation',
      'Water Supply',
      'Street Lights',
      'Sewage & Drainage',
      'Parks & Trees',
      'Stray Animals',
      'Others'
    ];

    for (let c = 0; c < categories.length; c++) {
      const category = categories[c];
      for (let i = 0; i < 5; i++) {
        const testNum = 31 + (c * 5) + i;
        await runTest(`${testNum}. Report ${category} - Scenario ${i + 1}`, async (d) => {
          await d.get('http://localhost:3000/report');
          const catBtn = await d.wait(until.elementLocated(By.xpath(`//button[text()='${category}']`)), 5000);
          await catBtn.click();

          const titleInput = await d.findElement(By.xpath("//input[@placeholder='Street address, Landmark, or Area...']"));
          await titleInput.sendKeys(`Sector ${c + 1} Ward ${i + 1} Issue`);

          const descArea = await d.findElement(By.xpath("//textarea[contains(@placeholder, ' leak')]"));
          await descArea.sendKeys(`E2E Auto-generated report for ${category}. Details regarding issue index ${i + 1}.`);

          const addressInput = await d.findElement(By.xpath("//input[@placeholder='Street address, Landmark, or Area...']"));
          await addressInput.clear();
          await addressInput.sendKeys(`Address line for ${category} test case ${i + 1}`);

          await d.findElement(By.xpath("//button[@type='submit']")).click();
          await d.wait(until.urlIs('http://localhost:3000/'), 8000);
        }, driver);
      }
    }

    // --- CATEGORY 6: NATIONAL E-GOVERNANCE GATEWAY APPOINTMENTS (30 Tests) ---
    const services = [
      { id: 'aadhaar', title: 'Aadhaar Services', option: 'Address Update' },
      { id: 'voter', title: 'Voter ID (EPIC)', option: 'Correction' },
      { id: 'passport', title: 'Passport Seva', option: 'Fresh Passport' },
      { id: 'birth', title: 'Birth Certificate', option: 'Duplicate Copy' }
    ];

    for (let i = 0; i < 30; i++) {
      const testNum = 71 + i;
      const s = services[i % services.length];
      await runTest(`${testNum}. Booking Service: ${s.title} (Iteration ${i + 1})`, async (d) => {
        await d.get('http://localhost:3000/services');
        const serviceCard = await d.wait(until.elementLocated(By.xpath(`//h3[text()='${s.title}']`)), 5000);
        await serviceCard.click();

        // Step 1: Briefing
        const chooseBtn = await d.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Choose Service Type')]")), 5000);
        await chooseBtn.click();

        // Step 2: Option
        const optBtn = await d.wait(until.elementLocated(By.xpath(`//p[text()='${s.option}']`)), 5000);
        await optBtn.click();

        // Step 3: Center
        const centerBtn = await d.wait(until.elementLocated(By.xpath("(//button[contains(., 'Zonal Office') or contains(., 'Passport') or contains(., 'Center')])[1]")), 5000);
        await centerBtn.click();

        // Step 4: DateTime
        const dateInput = await d.wait(until.elementLocated(By.xpath("//input[@type='date']")), 5000);
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + 3 + (i % 7)); // Avoid weekends
        if (bookingDate.getDay() === 0) {
          bookingDate.setDate(bookingDate.getDate() + 1); // Sunday -> Monday
        }
        const dateStr = bookingDate.toISOString().split('T')[0];

        await d.executeScript(
          `const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
           if (setter) {
             setter.call(arguments[0], arguments[1]);
             arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
             arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
           } else {
             arguments[0].value = arguments[1];
             arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
           }`,
          dateInput,
          dateStr
        );

        // Select slot
        const slotBtn = await d.wait(until.elementLocated(By.xpath("(//button[contains(@class, 'bg-zinc-50')])[1]")), 5000);
        await slotBtn.click();

        // Confirm
        const confirmBtn = await d.findElement(By.xpath("//button[text()='Confirm Booking']"));
        await confirmBtn.click();

        // Step 5: Success
        await d.wait(until.elementLocated(By.xpath("//h4[text()='Success!']")), 10000);
      }, driver);
    }

  } finally {
    await driver.quit();
    console.log('\n🏁 E2E Test execution complete. Generating report for 100 test cases...');
    await generateExcelReport(results, 'web_e2e_report.xlsx');
  }
}

main().catch(console.error);
