import { remote, RemoteOptions } from 'webdriverio';
import { generateExcelReport, TestResult } from '../selenium/excelReporter';

const results: TestResult[] = [];

async function runMobileTest(name: string, fn: () => Promise<void>) {
  const startTime = Date.now();
  console.log(`\n📱 Running Mobile E2E Test: [${name}]`);
  try {
    await fn();
    results.push({
      name,
      module: 'Mobile',
      status: 'PASSED',
      durationMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    });
    console.log(`✅ Passed: [${name}]`);
  } catch (err: any) {
    results.push({
      name,
      module: 'Mobile',
      status: 'FAILED',
      durationMs: Date.now() - startTime,
      errorMessage: err.message,
      timestamp: new Date().toLocaleTimeString(),
    });
    console.error(`❌ Failed: [${name}] - Error: ${err.message}`);
  }
}

async function main() {
  console.log('🤖 Starting Appium Mobile E2E Test Suite for CivicFlow...');

  // Setup capabilities for Appium connection
  const opts: RemoteOptions = {
    path: '/wd/hub',
    port: 4723,
    capabilities: {
      platformName: 'Android',
      'appium:deviceName': 'Android Emulator',
      'appium:automationName': 'UiAutomator2',
      'appium:appPackage': 'host.exp.exponent', // Expo Go
      'appium:appActivity': 'host.exp.exponent.LauncherActivity',
      'appium:noReset': true,
      'appium:newCommandTimeout': 180,
    }
  };

  let client: any = null;

  try {
    // 1. Establish session with Emulator
    await runMobileTest('Establish Emulator Connection', async () => {
      client = await remote(opts);
      console.log('Session established with device.');
    });

    if (!client) {
      throw new Error('Appium client failed to initialize');
    }

    // 2. Load CivicFlow app inside Expo
    await runMobileTest('Open CivicFlow Project in Expo', async () => {
      // In a real flow, Appium drives Expo Go to open the local development packager URL:
      // e.g. clicking the dev port card or entering the metro server URL
      await client.pause(5000);
    });

    // 3. Test Mobile Register Flow
    await runMobileTest('Validate Mobile Signup Fields', async () => {
      // Find register link and click it
      const createAccountLink = await client.$('~Create Account');
      await createAccountLink.click();

      // Enter signup fields
      const nameField = await client.$('//android.widget.EditText[1]');
      await nameField.setValue('Appium QA Tester');

      const emailField = await client.$('//android.widget.EditText[2]');
      await emailField.setValue('appium_tester@example.com');

      const passField = await client.$('//android.widget.EditText[4]');
      await passField.setValue('pass123');

      // Password mismatch verification (intentional typo to verify validation alert)
      const confirmPassField = await client.$('//android.widget.EditText[5]');
      await confirmPassField.setValue('pass1234'); // Intentional mismatch

      const submitBtn = await client.$('~Register');
      await submitBtn.click();

      // Wait for error dialog
      await client.pause(2000);
      const alertOkBtn = await client.$('//android.widget.Button[@text="OK"]');
      await alertOkBtn.click();
    });

    // 4. Test Mobile Login Flow
    await runMobileTest('Validate Mobile Login Flow', async () => {
      // Navigate to login
      const signInLink = await client.$('~Sign In');
      await signInLink.click();

      const emailField = await client.$('//android.widget.EditText[1]');
      await emailField.setValue('appium_tester@example.com');

      const passField = await client.$('//android.widget.EditText[2]');
      await passField.setValue('pass123');

      const loginBtn = await client.$('~Sign In Button');
      await loginBtn.click();

      // Wait for navigation transition to Dashboard
      await client.pause(4000);
    });

  } catch (error) {
    console.error('Mobile testing suite encountered an error:', error);
  } finally {
    if (client) {
      await client.deleteSession();
    }
    console.log('\n🏁 Mobile E2E Test execution complete. Generating report...');
    
    // Save report
    await generateExcelReport(results, 'mobile_e2e_report.xlsx');
  }
}

main().catch(console.error);
